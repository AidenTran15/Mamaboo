import json
import os
import boto3
from datetime import datetime, timezone

TABLE_NAME = os.getenv('CHECKLIST_TABLE', 'checklist')
REGION = os.getenv('AWS_REGION', 'ap-southeast-2')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

ALLOWED_SHIFTS = {'sang', 'trua', 'toi'}


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

    # Log full event structure
    print('=' * 80)
    print('FULL EVENT STRUCTURE:')
    print(json.dumps({k: (str(v)[:200] if isinstance(v, str) and len(str(v)) > 200 else v) 
                      for k, v in event.items()}, default=str, indent=2))
    print('=' * 80)
    
    body_raw = event.get('body')
    print(f'Raw body type: {type(body_raw)}')
    print(f'Raw body value (first 500 chars): {str(body_raw)[:500] if body_raw else None}')
    print(f'isBase64Encoded: {event.get("isBase64Encoded")}')
    
    # Log all event keys to see what's available
    print(f'Event keys: {list(event.keys())}')
    
    # Check if data might be in requestContext or other fields
    if 'requestContext' in event:
        print(f'requestContext keys: {list(event.get("requestContext", {}).keys())}')
    
    # Check headers for Content-Type and body-related info
    headers = event.get('headers') or {}
    print(f'Request headers keys: {list(headers.keys())}')
    if 'content-type' in headers or 'Content-Type' in headers:
        content_type = headers.get('content-type') or headers.get('Content-Type', '')
        print(f'Content-Type header: {content_type}')

    try:
        # Decode base64-encoded body if needed
        if event.get('isBase64Encoded') and isinstance(body_raw, str):
            import base64
            try:
                body_raw = base64.b64decode(body_raw).decode('utf-8', errors='replace')
                print('✓ Body was base64-encoded. Decoded as UTF-8 string.')
            except Exception as de:
                print(f'✗ Base64 decode failed: {type(de).__name__}: {str(de)}')

        # Handle both cases: body is string or already a dict
        body = {}
        if isinstance(body_raw, str):
            if body_raw.strip():
                try:
                    body = json.loads(body_raw)
                    print('✓ Parsed body from JSON string')
                except Exception as je:
                    print(f'✗ json.loads failed: {type(je).__name__}: {str(je)}')
                    print(f'  Body string length: {len(body_raw)}')
                    print(f'  Body string preview: {body_raw[:200]}')
            else:
                print('⚠ Body is empty string')
        elif isinstance(body_raw, dict):
            body = body_raw
            print('✓ Body is already a dict')
        elif body_raw is None:
            print('⚠⚠⚠ CRITICAL: Body is None - API Gateway may not be forwarding the request body!')
            print('  This usually means API Gateway is not configured with Lambda Proxy Integration.')
            print('  Please check API Gateway Integration Request settings.')
            # Try to check if data is in the event root (sometimes happens with non-proxy integration)
            print('  Checking event root for direct fields...')
            if 'user' in event or 'date' in event or 'shift' in event:
                print('  ⚠ Found data in event root (non-proxy integration detected)')
                body = {k: event[k] for k in ['user', 'date', 'shift', 'tasks', 'checklistType'] if k in event}
        else:
            print(f'⚠ Body is unexpected type: {type(body_raw)}')

        print(f'Parsed body keys: {list(body.keys()) if isinstance(body, dict) else "N/A"}')
        # Log body but truncate very long strings (like base64 images) for readability
        body_for_log = {}
        if isinstance(body, dict):
            for k, v in body.items():
                if k == 'tasks' and isinstance(v, dict):
                    # Log tasks structure separately (handled below)
                    body_for_log[k] = f'<tasks dict with {len(v)} keys>'
                elif isinstance(v, str) and len(v) > 500:
                    body_for_log[k] = f'{v[:100]}... (truncated, length={len(v)})'
                else:
                    body_for_log[k] = v
        print(f'Parsed body (truncated): {json.dumps(body_for_log, default=str)[:2000]}')

        user = (body.get('user') or '').strip()
        date = (body.get('date') or '').strip()  # YYYY-MM-DD
        shift = (body.get('shift') or '').strip()
        tasks = body.get('tasks') or {}
        checklist_type_raw = body.get('checklistType')
        if not checklist_type_raw:
            print('⚠ WARNING: checklistType is missing from body! Defaulting to "bat_dau"')
            print(f'  Body keys: {list(body.keys())}')
            print(f'  Body.get("checklistType"): {checklist_type_raw}')
        checklist_type = (checklist_type_raw or 'bat_dau').strip()  # 'bat_dau' or 'ket_ca'
        print(f'✓ Extracted checklistType: "{checklist_type}"')
        
        # Debug: Log tasks structure to check images
        print('=' * 80)
        print('TASKS STRUCTURE:')
        print(f'Tasks type: {type(tasks)}')
        print(f'Tasks keys: {list(tasks.keys()) if isinstance(tasks, dict) else "N/A"}')
        if isinstance(tasks, dict):
            for task_id, task_data in tasks.items():
                if isinstance(task_data, dict):
                    has_image = bool(task_data.get('imageUrl') or task_data.get('image'))
                    img_url = task_data.get('imageUrl') or task_data.get('image') or ''
                    img_len = len(str(img_url)) if img_url else 0
                    print(f'  Task {task_id}: done={task_data.get("done")}, has_image={has_image}, image_length={img_len}')
                    if img_url:
                        print(f'    Image preview (first 100 chars): {str(img_url)[:100]}...')
                else:
                    print(f'  Task {task_id}: {type(task_data).__name__}')
        print('=' * 80)

        # Fallback 1: read from queryStringParameters if body fields are missing
        if (not user or not date or not shift) and isinstance(event.get('queryStringParameters'), dict):
            q = event['queryStringParameters']
            user = user or (q.get('user') or '').strip()
            date = date or (q.get('date') or '').strip()
            shift = shift or (q.get('shift') or '').strip()
            print('✓ Filled missing fields from queryStringParameters')

        # Fallback 2: check if data is directly in event
        if (not user or not date or not shift):
            user = user or (event.get('user') or '').strip()
            date = date or (event.get('date') or '').strip()
            shift = shift or (event.get('shift') or '').strip()
            if user or date or shift:
                print('✓ Filled missing fields from event root')

        print(f'Final extracted values: user="{user}", date="{date}", shift="{shift}", checklistType="{checklist_type}"')

    except Exception as e:
        print(f'Error parsing body: {type(e).__name__}: {str(e)}')
        import traceback
        print(f'Traceback: {traceback.format_exc()}')
        return _response(400, {'success': False, 'message': f'Invalid JSON: {type(e).__name__}: {str(e)}'})

    # Special error message if body was None
    if body_raw is None and (not user or not date or not shift):
        error_msg = (
            'Request body is missing. This usually means API Gateway is not configured with '
            'Lambda Proxy Integration. Please check API Gateway Integration Request settings '
            'and ensure "Use Lambda Proxy integration" is enabled. See API_GATEWAY_CONFIGURATION.md for details.'
        )
        print(f'⚠⚠⚠ {error_msg}')
        return _response(400, {
            'success': False,
            'message': error_msg,
            'debug': {
                'body_raw_type': str(type(body_raw)),
                'event_keys': list(event.keys()),
                'has_headers': 'headers' in event
            }
        })

    if not user or not date or not shift:
        return _response(400, {'success': False, 'message': 'Missing user/date/shift'})
    if shift not in ALLOWED_SHIFTS:
        return _response(400, {'success': False, 'message': 'shift must be one of sang|trua|toi'})
    if checklist_type not in {'bat_dau', 'ket_ca'}:
        return _response(400, {'success': False, 'message': 'checklistType must be bat_dau or ket_ca'})

    # Simple date format check
    try:
        y, m, d = map(int, date.split('-'))
        _ = datetime(y, m, d)
    except Exception:
        return _response(400, {'success': False, 'message': 'date must be YYYY-MM-DD'})

    now_iso = datetime.now(timezone.utc).isoformat()
    # date_shift format: YYYY-MM-DD#shift hoặc YYYY-MM-DD#shift#ket_ca
    date_shift = f'{date}#{shift}#{checklist_type}' if checklist_type == 'ket_ca' else f'{date}#{shift}'
    
    print('=' * 80)
    print(f'CHECKLIST TYPE PROCESSING:')
    print(f'  Received checklistType: "{checklist_type}"')
    print(f'  Constructed date_shift: "{date_shift}"')
    print(f'  Full key: user="{user}", date_shift="{date_shift}"')
    print('=' * 80)
    
    key = {
        'user': user,
        'date_shift': date_shift
    }

    # Upsert the item, keep createdAt if exists
    try:
        # Final check: ensure tasks is a dict before saving
        if not isinstance(tasks, dict):
            print(f'⚠ WARNING: tasks is not a dict, converting...')
            tasks = {}
        
        # Count tasks with images before saving
        tasks_with_images = sum(1 for t in tasks.values() 
                               if isinstance(t, dict) and (t.get('imageUrl') or t.get('image')))
        print(f'Attempting to save: user={user}, date_shift={date_shift}, checklistType={checklist_type}')
        print(f'Tasks count: {len(tasks)}, Tasks with images: {tasks_with_images}')
        
        # Estimate total item size (including all fields, not just tasks)
        # Build a sample item to estimate total size
        sample_item = {
            'user': user,
            'date_shift': date_shift,
            'date': date,
            'shift': shift,
            'checklistType': checklist_type,
            'tasks': tasks,
            'updatedAt': now_iso,
            'createdAt': now_iso
        }
        estimated_total_size = len(json.dumps(sample_item, ensure_ascii=False))
        estimated_tasks_size = len(json.dumps(tasks, ensure_ascii=False))
        print(f'Estimated total item size: {estimated_total_size} bytes')
        print(f'Estimated tasks size: {estimated_tasks_size} bytes')
        print(f'Other fields size: ~{estimated_total_size - estimated_tasks_size} bytes')
        
        # DynamoDB item size limit is 400KB (400,000 bytes)
        # Warn if approaching limit, reject if exceeding
        if estimated_total_size > 400000:
            error_msg = f'Item size too large ({estimated_total_size} bytes). DynamoDB limit is 400KB. Please reduce image sizes or compress images more.'
            print(f'✗ {error_msg}')
            return _response(400, {
                'success': False, 
                'message': error_msg
            })
        elif estimated_total_size > 350000:  # ~350KB
            print(f'⚠ WARNING: Item size ({estimated_total_size} bytes) is approaching DynamoDB limit (400KB)')
            print(f'  Consider compressing images more or reducing number of images per checklist.')
        else:
            print(f'✓ Item size ({estimated_total_size} bytes) is within DynamoDB limits.')
        
        response = table.update_item(
            Key=key,
            UpdateExpression=(
                'SET #date = :date, #shift = :shift, #tasks = :tasks, #checklistType = :checklistType, #updatedAt = :updatedAt, '
                '#createdAt = if_not_exists(#createdAt, :updatedAt)'
            ),
            ExpressionAttributeNames={
                '#date': 'date',
                '#shift': 'shift',
                '#tasks': 'tasks',
                '#checklistType': 'checklistType',
                '#updatedAt': 'updatedAt',
                '#createdAt': 'createdAt'
            },
            ExpressionAttributeValues={
                ':date': date,
                ':shift': shift,
                ':tasks': tasks,
                ':checklistType': checklist_type,
                ':updatedAt': now_iso
            },
            ReturnValues='ALL_NEW'
        )
        print(f'Successfully saved item.')
        saved_item = response.get('Attributes', {})
        print(f'Saved item keys: {list(saved_item.keys())}')
        
        # Verify checklistType was saved correctly
        saved_checklist_type = saved_item.get('checklistType', '(not found)')
        saved_date_shift = saved_item.get('date_shift', '(not found)')
        print(f'✓ Saved checklistType: "{saved_checklist_type}"')
        print(f'✓ Saved date_shift: "{saved_date_shift}"')
        print(f'✓ Expected checklistType: "{checklist_type}"')
        print(f'✓ Expected date_shift: "{date_shift}"')
        if saved_checklist_type != checklist_type:
            print(f'⚠ WARNING: Saved checklistType ({saved_checklist_type}) does not match expected ({checklist_type})')
        if saved_date_shift != date_shift:
            print(f'⚠ WARNING: Saved date_shift ({saved_date_shift}) does not match expected ({date_shift})')
        
        # Verify tasks were saved correctly - detailed logging
        saved_tasks = saved_item.get('tasks', {})
        print('=' * 80)
        print('VERIFICATION: Checking saved tasks structure')
        print(f'Saved tasks type: {type(saved_tasks)}')
        print(f'Saved tasks count: {len(saved_tasks) if isinstance(saved_tasks, dict) else 0}')
        
        if isinstance(saved_tasks, dict):
            saved_tasks_with_images = 0
            for task_id, task_data in saved_tasks.items():
                if isinstance(task_data, dict):
                    img_url = task_data.get('imageUrl') or task_data.get('image') or ''
                    img_len = len(str(img_url)) if img_url else 0
                    has_img = bool(img_url and img_len > 100)
                    if has_img:
                        saved_tasks_with_images += 1
                    print(f'  Task {task_id}: has_image={has_img}, image_length={img_len}')
                    if img_len > 0 and img_len <= 200:
                        print(f'    Image preview (first 100 chars): {str(img_url)[:100]}...')
                    elif img_len > 200:
                        print(f'    Image starts with: {str(img_url)[:50]}... (total {img_len} chars)')
                else:
                    print(f'  Task {task_id}: task_data is not a dict, type={type(task_data)}')
            print(f'✓ Saved tasks with valid images: {saved_tasks_with_images}/{len(saved_tasks)}')
        else:
            print(f'⚠ WARNING: Saved tasks is not a dict: {type(saved_tasks)}')
            print(f'  Saved tasks value: {str(saved_tasks)[:500]}')
        
        # Also verify by reading back from DynamoDB immediately
        print('=' * 80)
        print('VERIFICATION: Reading back from DynamoDB immediately')
        try:
            read_response = table.get_item(Key=key)
            if 'Item' in read_response:
                read_item = read_response['Item']
                read_checklist_type = read_item.get('checklistType', '(not found)')
                read_date_shift = read_item.get('date_shift', '(not found)')
                print(f'✓ Read-back: checklistType="{read_checklist_type}", date_shift="{read_date_shift}"')
                if read_checklist_type != checklist_type:
                    print(f'⚠ WARNING: Read-back checklistType ({read_checklist_type}) does not match expected ({checklist_type})')
                
                read_tasks = read_item.get('tasks', {})
                if isinstance(read_tasks, dict):
                    read_tasks_with_images = sum(1 for t in read_tasks.values() 
                                                 if isinstance(t, dict) and (t.get('imageUrl') or t.get('image')) and len(str(t.get('imageUrl') or t.get('image') or '')) > 100)
                    print(f'✓ Read-back: tasks count={len(read_tasks)}, tasks with images={read_tasks_with_images}')
                    # Log first task image details
                    for task_id, task_data in list(read_tasks.items())[:1]:
                        if isinstance(task_data, dict):
                            img_url = task_data.get('imageUrl') or task_data.get('image') or ''
                            print(f'  First task {task_id} image length: {len(str(img_url))}')
                else:
                    print(f'⚠ Read-back: tasks is not a dict, type={type(read_tasks)}')
            else:
                print(f'⚠ Read-back: Item not found in DynamoDB immediately after save')
                print(f'  Tried to read with key: {key}')
        except Exception as read_err:
            print(f'⚠ Error reading back from DynamoDB: {type(read_err).__name__}: {str(read_err)}')
        print('=' * 80)
    except Exception as e:
        print(f'DynamoDB error occurred: {type(e).__name__}: {str(e)}')
        import traceback
        print(f'Traceback: {traceback.format_exc()}')
        return _response(500, {'success': False, 'message': f'DynamoDB error: {type(e).__name__}: {str(e)}'})

    return _response(200, {'success': True, 'message': 'Saved', 'key': key, 'date_shift': date_shift})
