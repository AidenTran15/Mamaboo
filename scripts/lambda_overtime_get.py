import json
import os
from datetime import datetime, timezone
import boto3

"""
Lambda GET overtime records

Query parameters (all optional):
- staffName: filter by staff name
- from: inclusive start date YYYY-MM-DD
- to  : inclusive end date YYYY-MM-DD
- type: filter by type (overtime|late)

Returns all records sorted by date (newest first).
"""

TABLE_NAME = os.getenv('OVERTIME_TABLE', 'overtime_records')
REGION = os.getenv('AWS_REGION', 'ap-southeast-2')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

ALLOWED_SHIFTS = {'sang', 'trua', 'toi'}
ALLOWED_TYPES = {'overtime', 'late'}


def convert_decimal(obj):
    """Convert Decimal objects to int or float for JSON serialization"""
    from decimal import Decimal
    if isinstance(obj, Decimal):
        # Convert to int if it's a whole number, otherwise float
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimal(item) for item in obj]
    return obj


def _response(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }


def lambda_handler(event, context):
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return _response(200, {'ok': True})

    try:
        # Parse query parameters
        params = event.get('queryStringParameters') or {}
        staff_name = params.get('staffName')
        date_from = params.get('from')
        date_to = params.get('to')
        record_type = params.get('type')

        # Validate type if provided
        if record_type and record_type not in ALLOWED_TYPES:
            return _response(400, {'error': f'Invalid type. Must be one of: {", ".join(ALLOWED_TYPES)}'})

        # Scan all items (since we don't have GSI for date/staffName)
        # In production, consider adding GSI for better query performance
        response = table.scan()
        items = response.get('Items', [])

        # Apply filters
        filtered = []
        for item in items:
            # Filter by staffName
            if staff_name and item.get('staffName') != staff_name:
                continue

            # Filter by type
            if record_type and item.get('type') != record_type:
                continue

            # Filter by date range
            item_date = item.get('date', '')
            if date_from and item_date < date_from:
                continue
            if date_to and item_date > date_to:
                continue

            filtered.append(item)

        # Sort by date (newest first), then by createdAt
        filtered.sort(key=lambda x: (x.get('date', ''), x.get('createdAt', '')), reverse=True)

        # Convert Decimal objects to int/float for JSON serialization
        filtered = convert_decimal(filtered)

        return _response(200, {
            'items': filtered,
            'count': len(filtered)
        })

    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        return _response(500, {'error': str(e)})


if __name__ == '__main__':
    # Test locally
    test_event = {
        'httpMethod': 'GET',
        'queryStringParameters': {
            'staffName': 'Kim Thu',
            'from': '2025-11-01',
            'to': '2025-11-30'
        }
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

