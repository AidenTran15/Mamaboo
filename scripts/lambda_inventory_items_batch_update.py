import json
import os
import boto3
from datetime import datetime, timezone

"""
Lambda POST batch update inventory items quantities

Body should contain:
{
  "items": {
    "ly-500ml": "100",      # itemId -> new quantity (string)
    "ly-700ml": "50",
    "matcha-thuong": "5"
  },
  "date": "2025-11-04",     # Optional: date of check
  "checkedBy": "Kim Thu"    # Optional: who checked
}

Logic:
- Only update items that are provided in the "items" object
- Items not in the request will keep their current quantity
- If item doesn't exist, create it with default values (requires all fields)
- Also save to inventory_records table for history

Returns:
{
  "updated": ["ly-500ml", "ly-700ml"],
  "created": [],
  "errors": [],
  "ok": true
}
"""

ITEMS_TABLE_NAME = os.getenv('INVENTORY_ITEMS_TABLE', 'inventory_items')
RECORDS_TABLE_NAME = os.getenv('INVENTORY_TABLE', 'inventory_records')
REGION = os.getenv('AWS_REGION', 'ap-southeast-2')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
items_table = dynamodb.Table(ITEMS_TABLE_NAME)
records_table = dynamodb.Table(RECORDS_TABLE_NAME)


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

        items_to_update = body.get('items', {})
        if not isinstance(items_to_update, dict):
            return _response(400, {'error': 'items must be a dictionary/object'})

        # Allow empty items - user might just want to save a record without updating quantities
        # In this case, we'll still try to save to inventory_records if date/checkedBy are provided

        date_str = body.get('date', '').strip()
        checked_by = body.get('checkedBy', '').strip()

        # If date not provided, use today
        if not date_str:
            today = datetime.now(timezone.utc)
            date_str = today.strftime('%Y-%m-%d')

        now = datetime.now(timezone.utc).isoformat() + 'Z'

        updated_items = []
        created_items = []
        errors = []

        # Update each item
        for item_id, new_quantity_str in items_to_update.items():
            try:
                # Validate quantity
                new_quantity = new_quantity_str.strip()
                if not new_quantity:
                    continue  # Skip empty values
                
                try:
                    float(new_quantity)  # Validate it's a number
                except ValueError:
                    errors.append(f"Invalid quantity for {item_id}: {new_quantity}")
                    continue

                # Get current item
                try:
                    existing = items_table.get_item(Key={'itemId': item_id})
                    if 'Item' in existing:
                        # Item exists, update quantity
                        current_item = existing['Item']
                        current_quantity = str(current_item.get('quantity', '0')).strip()
                        new_quantity_clean = str(new_quantity).strip()
                        
                        # Normalize comparison: convert to float for numeric comparison
                        try:
                            current_float = float(current_quantity) if current_quantity else 0.0
                            new_float = float(new_quantity_clean) if new_quantity_clean else 0.0
                            
                            # Only update if quantity has changed (numeric comparison)
                            if abs(current_float - new_float) > 0.0001:  # Use small epsilon for float comparison
                                items_table.update_item(
                                    Key={'itemId': item_id},
                                    UpdateExpression='SET quantity = :q, updatedAt = :u',
                                    ExpressionAttributeValues={
                                        ':q': new_quantity_clean,
                                        ':u': now
                                    }
                                )
                                updated_items.append(item_id)
                                print(f"Updated {item_id}: {current_quantity} -> {new_quantity_clean}")
                            else:
                                print(f"Skipped {item_id}: quantity unchanged ({current_quantity})")
                        except ValueError:
                            # If not numeric, do string comparison
                            if current_quantity != new_quantity_clean:
                                items_table.update_item(
                                    Key={'itemId': item_id},
                                    UpdateExpression='SET quantity = :q, updatedAt = :u',
                                    ExpressionAttributeValues={
                                        ':q': new_quantity_clean,
                                        ':u': now
                                    }
                                )
                                updated_items.append(item_id)
                                print(f"Updated {item_id}: {current_quantity} -> {new_quantity_clean}")
                            else:
                                print(f"Skipped {item_id}: quantity unchanged ({current_quantity})")
                        # If quantity is the same, skip update (keep old quantity)
                    else:
                        # Item doesn't exist - we can't create it without all required fields
                        errors.append(f"Item {item_id} not found in inventory_items table. Please add it first.")
                except Exception as e:
                    error_msg = str(e)
                    if 'ResourceNotFoundException' in error_msg:
                        errors.append(f"Table {ITEMS_TABLE_NAME} not found. Please create the table first.")
                    else:
                        errors.append(f"Error updating {item_id}: {error_msg}")
                    continue

            except Exception as e:
                errors.append(f"Error processing {item_id}: {str(e)}")
                continue

        # Save to inventory_records table for history (even if no items were updated)
        try:
            # Prepare record for inventory_records
            # Convert string quantities to proper format for DynamoDB
            items_for_record = {}
            for item_id, qty_str in items_to_update.items():
                items_for_record[item_id] = str(qty_str)  # Store as string
            
            record_item = {
                'date': date_str,
                'checkedBy': checked_by or 'Unknown',
                'items': items_for_record,  # Items that were submitted (may be empty)
                'createdAt': now,
                'updatedAt': now
            }

            records_table.put_item(Item=record_item)
        except Exception as e:
            error_msg = str(e)
            if 'ResourceNotFoundException' in error_msg:
                # Table doesn't exist, but that's okay - we still updated items
                pass
            else:
                errors.append(f"Warning: Could not save to inventory_records: {error_msg}")

        return _response(200, {
            'updated': updated_items,
            'created': created_items,
            'errors': errors,
            'ok': True,
            'count': len(updated_items) + len(created_items)
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
            'items': {
                'ly-500ml': '100',
                'ly-700ml': '50',
                'matcha-thuong': '5'
            },
            'date': '2025-11-04',
            'checkedBy': 'Kim Thu'
        })
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

