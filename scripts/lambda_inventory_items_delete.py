import json
import os
import boto3

"""
Lambda DELETE inventory item

Query parameters:
- itemId: ID of the item to delete (required)

Returns success message.
"""

TABLE_NAME = os.getenv('INVENTORY_ITEMS_TABLE', 'inventory_items')
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
        item_id = params.get('itemId', '').strip()

        if not item_id:
            return _response(400, {'error': 'itemId query parameter is required'})

        # Check if item exists
        try:
            existing = table.get_item(Key={'itemId': item_id})
            if 'Item' not in existing:
                return _response(404, {'error': f'Item with ID {item_id} not found'})
        except Exception as e:
            return _response(500, {'error': f'Error checking item: {str(e)}'})

        # Delete the item
        table.delete_item(Key={'itemId': item_id})

        return _response(200, {
            'ok': True,
            'message': f'Item with ID {item_id} deleted successfully'
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
            'itemId': 'ly-500ml'
        }
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

