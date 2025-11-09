import json
import os
import boto3

"""
Lambda DELETE inventory record

Query parameters:
- date: date of the record to delete (YYYY-MM-DD) - required

Returns success message.
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
            'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
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
        date_str = params.get('date', '').strip()

        if not date_str:
            return _response(400, {'error': 'date query parameter is required'})

        # Validate date format (YYYY-MM-DD)
        try:
            from datetime import datetime
            datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return _response(400, {'error': 'date must be in format YYYY-MM-DD'})

        # Check if record exists
        try:
            existing = table.get_item(Key={'date': date_str})
            if 'Item' not in existing:
                return _response(404, {'error': f'Record with date {date_str} not found'})
        except Exception as e:
            return _response(500, {'error': f'Error checking record: {str(e)}'})

        # Delete the record
        table.delete_item(Key={'date': date_str})

        return _response(200, {
            'ok': True,
            'message': f'Record with date {date_str} deleted successfully'
        })

    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        return _response(500, {'error': str(e)})


if __name__ == '__main__':
    # Test locally
    test_event = {
        'httpMethod': 'DELETE',
        'queryStringParameters': {
            'date': '2025-11-04'
        }
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

