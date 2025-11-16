import json
import os
from datetime import datetime, timezone
import boto3

"""
Lambda GET checklist items

Query parameters (all optional, but at least one of user or date range is recommended):
- user: filter by username
- from: inclusive start date YYYY-MM-DD
- to  : inclusive end date YYYY-MM-DD

If no range is provided, defaults to current pay period (16th this month → 15th next month, inclusive).
Returns items sorted by date, then shift.
"""

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
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }


def _current_pay_period_today():
    now = datetime.now(timezone.utc)
    y, m = now.year, now.month
    start = datetime(y, m, 16, tzinfo=timezone.utc)
    if now.day < 16:
        # period is 16 of previous month to 15 of this month (inclusive)
        if m == 1:
            y2, m2 = y - 1, 12
        else:
            y2, m2 = y, m - 1
        start = datetime(y2, m2, 16, tzinfo=timezone.utc)
    # end 15th next month (inclusive, DynamoDB between is inclusive on both ends)
    if start.month == 12:
        end = datetime(start.year + 1, 1, 15, tzinfo=timezone.utc)
    else:
        end = datetime(start.year, start.month + 1, 15, tzinfo=timezone.utc)
    return start.date().isoformat(), end.date().isoformat()


def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return _response(200, {'ok': True})

    params = event.get('queryStringParameters') or {}
    user = (params.get('user') or '').strip()
    from_date = (params.get('from') or '').strip()
    to_date = (params.get('to') or '').strip()
    
    # Nếu có 'all' parameter hoặc không có from/to, trả về tất cả items (không filter date range)
    fetch_all = params.get('all') == 'true' or (not from_date and not to_date)
    
    # Validate date range nếu có
    if not fetch_all:
        try:
            y, m, d = map(int, from_date.split('-'))
            _ = datetime(y, m, d)
            y, m, d = map(int, to_date.split('-'))
            _ = datetime(y, m, d)
        except Exception:
            return _response(400, {'success': False, 'message': 'from/to must be YYYY-MM-DD'})

    # Strategy: Scan all items first (with pagination), then filter client-side
    # This ensures we get ALL items, not just those in the first page of filtered results
    try:
        # Scan với pagination để lấy tất cả items
        items = []
        resp = table.scan()
        items.extend(resp.get('Items', []))
        
        # Tiếp tục scan nếu còn dữ liệu
        while 'LastEvaluatedKey' in resp:
            resp = table.scan(ExclusiveStartKey=resp['LastEvaluatedKey'])
            items.extend(resp.get('Items', []))
        
        print(f'=== CHECKLIST GET DEBUG ===')
        print(f'Total items scanned from DynamoDB: {len(items)}')
        print(f'Fetch all mode: {fetch_all}')
        print(f'Filter params: from={from_date}, to={to_date}, user={user}')
        
        # Filter client-side theo date range và user
        filtered = []
        for item in items:
            # Chỉ filter date range nếu không phải fetch_all
            if not fetch_all:
                item_date = item.get('date', '')
                if from_date and item_date < from_date:
                    continue
                if to_date and item_date > to_date:
                    continue
            # Filter theo user nếu có
            if user:
                item_user = (item.get('user') or '').strip()
                if item_user.lower() != user.lower():
                    continue
            filtered.append(item)
        
        print(f'Items after filtering: {len(filtered)}')
        items = filtered
    except Exception as e:
        return _response(500, {'success': False, 'message': f'DynamoDB error: {e}'})

    def sort_key(it):
        date = it.get('date') or ''
        shift = it.get('shift') or ''
        type_suffix = it.get('checklistType') or ('ket_ca' if str(it.get('date_shift','')).endswith('#ket_ca') else 'bat_dau')
        order = {'sang': 0, 'trua': 1, 'toi': 2}.get(shift, 9)
        tord = {'bat_dau': 0, 'ket_ca': 1}.get(type_suffix, 1)
        return (date, order, tord)

    items.sort(key=sort_key)
    
    # Convert Decimal types to native types for JSON serialization
    def convert_decimals(obj):
        from decimal import Decimal
        if isinstance(obj, Decimal):
            return float(obj) if obj % 1 != 0 else int(obj)
        elif isinstance(obj, dict):
            return {k: convert_decimals(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_decimals(item) for item in obj]
        return obj
    
    items = convert_decimals(items)
    
    # Debug: Log all items with detailed image information
    print('=' * 80)
    print('=== GET CHECKLIST DEBUG ===')
    print(f'Total items retrieved: {len(items)}')
    for idx, item in enumerate(items):
        print(f'\n--- Item {idx+1}/{len(items)} ---')
        print(f'  user={item.get("user")}, date={item.get("date")}, shift={item.get("shift")}, checklistType={item.get("checklistType")}')
        print(f'  date_shift={item.get("date_shift")}')
        tasks = item.get('tasks', {})
        print(f'  tasks type: {type(tasks)}, tasks is dict: {isinstance(tasks, dict)}')
        if isinstance(tasks, dict):
            print(f'  tasks count: {len(tasks)}')
            print(f'  tasks keys: {list(tasks.keys())}')
            tasks_with_images = 0
            for task_id, task_data in tasks.items():
                if isinstance(task_data, dict):
                    img_url = task_data.get('imageUrl') or task_data.get('image') or ''
                    img_len = len(str(img_url)) if img_url else 0
                    has_img = bool(img_url and img_len > 100)
                    if has_img:
                        tasks_with_images += 1
                    print(f'    Task {task_id}: done={task_data.get("done")}, has_image={has_img}, image_length={img_len}')
                    if img_len > 0 and img_len <= 200:
                        print(f'      Image preview: {str(img_url)[:100]}...')
                    elif img_len > 200:
                        print(f'      Image starts: {str(img_url)[:50]}... (total {img_len} chars)')
                else:
                    print(f'    Task {task_id}: task_data type={type(task_data)}, value={str(task_data)[:100]}')
            print(f'  ✓ Tasks with valid images: {tasks_with_images}/{len(tasks)}')
        else:
            print(f'  ⚠ WARNING: tasks is not a dict: {type(tasks)}')
            print(f'    tasks value (first 500 chars): {str(tasks)[:500]}')
    print('=' * 80)

    return _response(200, {
        'success': True,
        'from': from_date,
        'to': to_date,
        'count': len(items),
        'items': items
    })


