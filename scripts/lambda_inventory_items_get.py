import json
import os
import boto3

"""
Lambda GET inventory items

Query parameters (all optional):
- category: filter by category (packaging, bot, sot, etc.)
- itemId: get specific item by ID

Returns all items or filtered items.
"""

TABLE_NAME = os.getenv('INVENTORY_ITEMS_TABLE', 'inventory_items')
REGION = os.getenv('AWS_REGION', 'ap-southeast-2')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


def convert_decimal(obj):
    """Convert Decimal objects to int or float for JSON serialization"""
    from decimal import Decimal
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
        category = params.get('category')
        item_id = params.get('itemId')

        # If itemId is provided, get specific item
        if item_id:
            try:
                response = table.get_item(Key={'itemId': item_id})
                if 'Item' not in response:
                    return _response(404, {'error': f'Item with ID {item_id} not found'})
                
                item = convert_decimal(response['Item'])
                return _response(200, {'item': item})
            except Exception as e:
                return _response(500, {'error': str(e)})

        # Otherwise, scan all items
        response = table.scan()
        items = response.get('Items', [])

        # Filter by category if provided
        if category:
            items = [item for item in items if item.get('category') == category]

        # Sort by category, then by name
        items.sort(key=lambda x: (x.get('category', ''), x.get('name', '')))

        # Convert Decimal objects
        items = convert_decimal(items)

        return _response(200, {
            'items': items,
            'count': len(items)
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
            'category': 'packaging'
        }
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

