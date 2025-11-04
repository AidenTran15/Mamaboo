import json
import os
from datetime import datetime, timezone
import boto3
from decimal import Decimal

"""
Lambda GET penalty records

Query parameters (all optional):
- staffName: filter by staff name
- from: inclusive start date YYYY-MM-DD
- to  : inclusive end date YYYY-MM-DD
- penaltyLevel: filter by penalty level (1|2|3|4|5)

Returns all records sorted by date (newest first).
"""

TABLE_NAME = os.getenv('PENALTY_TABLE', 'penalty_records')
REGION = os.getenv('AWS_REGION', 'ap-southeast-2')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

ALLOWED_PENALTY_LEVELS = {'1', '2', '3', '4', '5'}


def convert_decimal(obj):
    """Convert Decimal objects to int or float for JSON serialization"""
    if isinstance(obj, Decimal):
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
    if event.get('httpMethod') == 'OPTIONS':
        return _response(200, {'ok': True})

    try:
        params = event.get('queryStringParameters') or {}
        staff_name = params.get('staffName')
        date_from = params.get('from')
        date_to = params.get('to')
        penalty_level = params.get('penaltyLevel')

        if penalty_level and penalty_level not in ALLOWED_PENALTY_LEVELS:
            return _response(400, {'error': f'Invalid penaltyLevel. Must be one of: {", ".join(sorted(ALLOWED_PENALTY_LEVELS))}'})

        response = table.scan()
        items = response.get('Items', [])

        filtered = []
        for item in items:
            if staff_name and item.get('staffName') != staff_name:
                continue
            if penalty_level and item.get('penaltyLevel') != penalty_level:
                continue
            item_date = item.get('date', '')
            if date_from and item_date < date_from:
                continue
            if date_to and item_date > date_to:
                continue
            filtered.append(item)

        filtered.sort(key=lambda x: (x.get('date', ''), x.get('createdAt', '')), reverse=True)
        filtered = convert_decimal(filtered)  # Convert Decimal objects for JSON serialization

        return _response(200, {
            'items': filtered,
            'count': len(filtered)
        })

    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        return _response(500, {'error': str(e)})

