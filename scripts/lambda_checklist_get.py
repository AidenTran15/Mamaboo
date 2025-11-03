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

If no range is provided, defaults to current pay period (15th this month → 15th next month).
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
    start = datetime(y, m, 15, tzinfo=timezone.utc)
    if now.day < 15:
        # period is 15 of previous month to 15 of this month
        if m == 1:
            y2, m2 = y - 1, 12
        else:
            y2, m2 = y, m - 1
        start = datetime(y2, m2, 15, tzinfo=timezone.utc)
    # end 15th next month
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

    # default range = current pay period
    if not from_date or not to_date:
        d1, d2 = _current_pay_period_today()
        from_date = from_date or d1
        to_date = to_date or d2

    # basic validation
    try:
        y, m, d = map(int, from_date.split('-'))
        _ = datetime(y, m, d)
        y, m, d = map(int, to_date.split('-'))
        _ = datetime(y, m, d)
    except Exception:
        return _response(400, {'success': False, 'message': 'from/to must be YYYY-MM-DD'})

    # Strategy: use Scan with FilterExpression (simple, acceptable for small data)
    # Data key: date_shift = YYYY-MM-DD#shift or YYYY-MM-DD#shift#ket_ca
    # We'll filter by begins_with(date_shift, yyyy-mm-dd) across the range
    from boto3.dynamodb.conditions import Attr

    try:
        filt = Attr('date').between(from_date, to_date)
        if user:
            filt = filt & Attr('user').eq(user)

        items = []
        resp = table.scan(FilterExpression=filt)
        items.extend(resp.get('Items', []))
        while 'LastEvaluatedKey' in resp:
            resp = table.scan(FilterExpression=filt, ExclusiveStartKey=resp['LastEvaluatedKey'])
            items.extend(resp.get('Items', []))
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

    return _response(200, {
        'success': True,
        'from': from_date,
        'to': to_date,
        'count': len(items),
        'items': items
    })


