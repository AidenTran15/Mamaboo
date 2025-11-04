import json
import os
import boto3
from datetime import datetime, timezone

"""
Lambda POST overtime records

Body should contain:
{
  "staffName": "Kim Thu",
  "date": "2025-11-04",
  "shift": "sang",
  "type": "overtime",  # or "late"
  "hours": 2
}

Returns the created record with generated ID.
"""

TABLE_NAME = os.getenv('OVERTIME_TABLE', 'overtime_records')
REGION = os.getenv('AWS_REGION', 'ap-southeast-2')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

ALLOWED_SHIFTS = {'sang', 'trua', 'toi'}
ALLOWED_TYPES = {'overtime', 'late'}


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
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return _response(200, {'ok': True})

    try:
        # Parse body
        # Support both API Gateway format (event.body is string) and direct test format (event is the body)
        body_raw = event.get('body')
        if body_raw is None:
            # Direct test format: event itself is the body
            body = event
        elif isinstance(body_raw, str):
            try:
                body = json.loads(body_raw)
            except json.JSONDecodeError:
                return _response(400, {'error': 'Invalid JSON in body'})
        else:
            body = body_raw or {}

        # Validate required fields
        staff_name = body.get('staffName', '').strip()
        date_str = body.get('date', '').strip()
        shift = body.get('shift', '').strip()
        record_type = body.get('type', '').strip()
        hours = body.get('hours')

        if not staff_name:
            return _response(400, {'error': 'staffName is required'})
        if not date_str:
            return _response(400, {'error': 'date is required'})
        if shift not in ALLOWED_SHIFTS:
            return _response(400, {'error': f'shift must be one of: {", ".join(ALLOWED_SHIFTS)}'})
        if record_type not in ALLOWED_TYPES:
            return _response(400, {'error': f'type must be one of: {", ".join(ALLOWED_TYPES)}'})
        if not isinstance(hours, (int, float)) or hours <= 0:
            return _response(400, {'error': 'hours must be a positive number'})

        # Generate unique ID (timestamp)
        record_id = str(int(datetime.now(timezone.utc).timestamp() * 1000))
        createdAt = datetime.now(timezone.utc).isoformat() + 'Z'

        # Create record
        item = {
            'id': record_id,
            'staffName': staff_name,
            'date': date_str,
            'shift': shift,
            'type': record_type,
            'hours': int(hours) if isinstance(hours, float) and hours.is_integer() else hours,
            'createdAt': createdAt
        }

        # Save to DynamoDB
        table.put_item(Item=item)

        return _response(200, {'item': item, 'ok': True})

    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        return _response(500, {'error': str(e)})


if __name__ == '__main__':
    # Test locally
    test_event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'staffName': 'Kim Thu',
            'date': '2025-11-04',
            'shift': 'sang',
            'type': 'overtime',
            'hours': 2
        })
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

