import json
import os
import boto3
from datetime import datetime, timezone

"""
Lambda POST inventory item (create or update)

Body should contain:
{
  "itemId": "ly-500ml",                    # ID của sản phẩm (required)
  "name": "Ly 500ml",                       # Tên sản phẩm (required)
  "unit": "ống",                            # Đơn vị tính (required)
  "category": "packaging",                 # Danh mục (required)
  "categoryName": "PACKAGING",             # Tên danh mục hiển thị (optional)
  "purchaseLink": "https://example.com/...", # Link mua hàng (optional)
  "alertThreshold": "20",                   # Ngưỡng cảnh báo (optional)
  "quantity": "100"                         # Số lượng hiện tại (optional, default: "0")
}

Returns the created/updated item.
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
        body_raw = event.get('body')
        
        if body_raw is None:
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
        item_id = body.get('itemId', '').strip()
        name = body.get('name', '').strip()
        unit = body.get('unit', '').strip()
        category = body.get('category', '').strip()

        if not item_id:
            return _response(400, {'error': 'itemId is required'})
        if not name:
            return _response(400, {'error': 'name is required'})
        if not unit:
            return _response(400, {'error': 'unit is required'})
        if not category:
            return _response(400, {'error': 'category is required'})

        # Check if item exists
        try:
            existing = table.get_item(Key={'itemId': item_id})
            is_update = 'Item' in existing
        except Exception:
            is_update = False

        now = datetime.now(timezone.utc).isoformat() + 'Z'

        # Prepare item
        item = {
            'itemId': item_id,
            'name': name,
            'unit': unit,
            'category': category,
            'updatedAt': now
        }

        # Add optional fields
        category_name = body.get('categoryName', '').strip()
        if category_name:
            item['categoryName'] = category_name

        purchase_link = body.get('purchaseLink', '').strip()
        if purchase_link:
            item['purchaseLink'] = purchase_link

        alert_threshold = body.get('alertThreshold', '').strip()
        if alert_threshold:
            item['alertThreshold'] = alert_threshold

        # Handle quantity - if provided, update it; if not provided and new item, set to "0"
        quantity = body.get('quantity', '').strip()
        if quantity:
            # Validate quantity is a valid number
            try:
                float(quantity)
                item['quantity'] = quantity
            except ValueError:
                return _response(400, {'error': 'quantity must be a valid number'})
        elif not is_update:
            # New item without quantity specified, default to "0"
            item['quantity'] = '0'

        # Add createdAt only for new items
        if not is_update:
            item['createdAt'] = now

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
            'itemId': 'ly-500ml',
            'name': 'Ly 500ml',
            'unit': 'ống',
            'category': 'packaging',
            'categoryName': 'PACKAGING',
            'purchaseLink': 'https://example.com/ly-500ml',
            'alertThreshold': '20'
        })
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

