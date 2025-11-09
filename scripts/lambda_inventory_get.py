import json
import os
from datetime import datetime, timezone
import boto3

"""
Lambda GET inventory records

Query parameters (all optional):
- from: inclusive start date YYYY-MM-DD
- to  : inclusive end date YYYY-MM-DD
- checkedBy: filter by checker name

Returns all records sorted by date (newest first).
"""

TABLE_NAME = os.getenv('INVENTORY_TABLE', 'inventory_records')
REGION = os.getenv('AWS_REGION', 'ap-southeast-2')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


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
    # Handle case where event is a JSON string (Lambda console test)
    if isinstance(event, str):
        try:
            event = json.loads(event)
        except json.JSONDecodeError:
            return _response(400, {'error': 'Invalid JSON event'})
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return _response(200, {'ok': True})

    try:
        # Parse query parameters
        params = event.get('queryStringParameters') or {}
        date_from = params.get('from')
        date_to = params.get('to')
        checked_by = params.get('checkedBy')

        # Scan all items (since we don't have GSI for date range)
        # In production, consider adding GSI if needed for better query performance
        response = table.scan()
        items = response.get('Items', [])

        # Apply filters
        filtered = []
        for item in items:
            # Filter by checkedBy
            if checked_by and item.get('checkedBy') != checked_by:
                continue

            # Filter by date range
            item_date = item.get('date', '')
            if date_from and item_date < date_from:
                continue
            if date_to and item_date > date_to:
                continue

            filtered.append(item)

        # Sort by date (newest first)
        filtered.sort(key=lambda x: x.get('date', ''), reverse=True)

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
            'from': '2025-11-01',
            'to': '2025-11-30',
            'checkedBy': 'Kim Thu'
        }
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

