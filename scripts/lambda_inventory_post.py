import json
import os
import boto3
from datetime import datetime, timezone
from decimal import Decimal

"""
Lambda POST inventory records

Body should contain:
{
  "date": "2025-11-04",                    # ngày kiểm tra (YYYY-MM-DD)
  "checkedBy": "Kim Thu",                  # người kiểm tra
  "items": {                                # Map chứa số lượng từng item
    "ly-500ml": "100",
    "ly-700ml": "50",
    ...
  },
  "alerts": {                               # Map chứa alert thresholds (optional)
    "ly-500ml": "20",
    ...
  }
}

Note: Nếu record với date đã tồn tại, sẽ update (overwrite).
Returns the created/updated record.
"""

TABLE_NAME = os.getenv('INVENTORY_TABLE', 'inventory_records')
REGION = os.getenv('AWS_REGION', 'ap-southeast-2')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


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
        # Parse body
        # Support multiple formats:
        # 1. API Gateway format: event.body is string JSON
        # 2. Direct test format: event itself is the body (dict)
        # 3. Lambda console test: event is already parsed dict with 'body' key
        body_raw = event.get('body')
        
        if body_raw is None:
            # Direct test format: event itself is the body
            # But check if event has httpMethod - if so, it's API Gateway format without body
            if 'httpMethod' in event:
                return _response(400, {'error': 'Request body is required'})
            body = event
        elif isinstance(body_raw, str):
            try:
                body = json.loads(body_raw)
            except json.JSONDecodeError:
                return _response(400, {'error': 'Invalid JSON in body'})
        else:
            body = body_raw or {}

        # Validate required fields
        date_str = body.get('date', '').strip()
        checked_by = body.get('checkedBy', '').strip()
        items = body.get('items', {})

        if not date_str:
            return _response(400, {'error': 'date is required'})
        if not checked_by:
            return _response(400, {'error': 'checkedBy is required'})
        if not isinstance(items, dict):
            return _response(400, {'error': 'items must be an object/map'})

        # Validate date format (YYYY-MM-DD)
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return _response(400, {'error': 'date must be in format YYYY-MM-DD'})

        # Check if record exists
        try:
            existing = table.get_item(Key={'date': date_str})
            is_update = 'Item' in existing
        except Exception:
            is_update = False

        now = datetime.now(timezone.utc).isoformat() + 'Z'

        # Prepare item
        item = {
            'date': date_str,
            'checkedBy': checked_by,
            'items': items,  # DynamoDB will handle Map type automatically
            'updatedAt': now
        }

        # Add createdAt only for new records
        if not is_update:
            item['createdAt'] = now

        # Add alerts if provided
        alerts = body.get('alerts')
        if alerts and isinstance(alerts, dict):
            item['alerts'] = alerts

        # Save to DynamoDB
        table.put_item(Item=item)

        return _response(200, {
            'item': item,
            'ok': True,
            'action': 'updated' if is_update else 'created'
        })

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
            'date': '2025-11-04',
            'checkedBy': 'Kim Thu',
            'items': {
                'ly-500ml': '100',
                'ly-700ml': '50',
                'ly-1lit': '30'
            },
            'alerts': {
                'ly-500ml': '20'
            }
        })
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

