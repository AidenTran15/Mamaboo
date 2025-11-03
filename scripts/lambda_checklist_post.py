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
            else:
                print('⚠ Body is empty string')
        elif isinstance(body_raw, dict):
            body = body_raw
            print('✓ Body is already a dict')
        elif body_raw is None:
            print('⚠ Body is None')
        else:
            print(f'⚠ Body is unexpected type: {type(body_raw)}')

        print(f'Parsed body keys: {list(body.keys()) if isinstance(body, dict) else "N/A"}')
        print(f'Parsed body (first 1000 chars): {json.dumps(body, default=str)[:1000]}')

        user = (body.get('user') or '').strip()
        date = (body.get('date') or '').strip()  # YYYY-MM-DD
        shift = (body.get('shift') or '').strip()
        tasks = body.get('tasks') or {}
        checklist_type = (body.get('checklistType') or 'bat_dau').strip()  # 'bat_dau' or 'ket_ca'

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
    key = {
        'user': user,
        'date_shift': date_shift
    }

    # Upsert the item, keep createdAt if exists
    try:
        print(f'Attempting to save: user={user}, date_shift={date_shift}, checklistType={checklist_type}')
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
        print(f'Successfully saved item. Response: {response}')
        saved_item = response.get('Attributes', {})
        print(f'Saved item keys: {list(saved_item.keys())}')
    except Exception as e:
        print(f'DynamoDB error occurred: {type(e).__name__}: {str(e)}')
        import traceback
        print(f'Traceback: {traceback.format_exc()}')
        return _response(500, {'success': False, 'message': f'DynamoDB error: {type(e).__name__}: {str(e)}'})

    return _response(200, {'success': True, 'message': 'Saved', 'key': key, 'date_shift': date_shift})
