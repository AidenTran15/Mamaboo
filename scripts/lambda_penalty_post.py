import json
import os
import boto3
from datetime import datetime, timezone
from decimal import Decimal

"""
Lambda POST penalty records

Body should contain:
{
  "staffName": "Kim Thu",
  "date": "2025-11-04",
  "penaltyLevel": "1",  # 0|1|2|3|4|5 (0 = nhắc nhở, không trừ lương)
  "reason": "Đi trễ nhiều lần"
}

Returns the created record with generated ID.
"""

TABLE_NAME = os.getenv('PENALTY_TABLE', 'penalty_records')
REGION = os.getenv('AWS_REGION', 'ap-southeast-2')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

ALLOWED_PENALTY_LEVELS = {'0', '1', '2', '3', '4', '5'}


def _response(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }


def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return _response(200, {'ok': True})

    try:
        body_raw = event.get('body')
        if body_raw is None:
            body = event
        elif isinstance(body_raw, str):
            try:
                body = json.loads(body_raw)
            except json.JSONDecodeError:
                return _response(400, {'error': 'Invalid JSON in body'})
        else:
            body = body_raw or {}

        staff_name = body.get('staffName', '').strip()
        date_str = body.get('date', '').strip()
        penalty_level = body.get('penaltyLevel', '').strip()
        reason = body.get('reason', '').strip()

        if not staff_name:
            return _response(400, {'error': 'staffName is required'})
        if not date_str:
            return _response(400, {'error': 'date is required'})
        if penalty_level not in ALLOWED_PENALTY_LEVELS:
            return _response(400, {'error': f'penaltyLevel must be one of: {", ".join(sorted(ALLOWED_PENALTY_LEVELS))}'})
        if not reason:
            return _response(400, {'error': 'reason is required'})

        record_id = str(int(datetime.now(timezone.utc).timestamp() * 1000))
        createdAt = datetime.now(timezone.utc).isoformat() + 'Z'

        item = {
            'id': record_id,
            'staffName': staff_name,
            'date': date_str,
            'penaltyLevel': penalty_level,
            'reason': reason,
            'createdAt': createdAt
        }

        table.put_item(Item=item)

        return _response(200, {'item': item, 'ok': True})

    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        return _response(500, {'error': str(e)})

