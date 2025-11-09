import json
import os
import boto3
from decimal import Decimal

"""
Lambda GET inventory records (lịch sử kiểm kê)

Query parameters (all optional):
- date: filter by specific date (YYYY-MM-DD)
- checkedBy: filter by person who checked
- limit: maximum number of records to return (default: 100)
- startDate: filter records from this date onwards (YYYY-MM-DD)
- endDate: filter records up to this date (YYYY-MM-DD)

Returns all records or filtered records, sorted by date (descending) then timestamp (descending).
"""

TABLE_NAME = os.getenv('INVENTORY_TABLE', 'inventory_records')
REGION = os.getenv('AWS_REGION', 'ap-southeast-2')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


def convert_decimal(obj):
    """Convert Decimal objects to int or float for JSON serialization"""
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
        'body': json.dumps(body, ensure_ascii=False, default=str)
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
        date_filter = params.get('date')
        checked_by_filter = params.get('checkedBy')
        limit = int(params.get('limit', 100))
        start_date = params.get('startDate')
        end_date = params.get('endDate')

        # If specific date is provided, query by date
        if date_filter:
            try:
                response = table.query(
                    KeyConditionExpression='date = :date',
                    ExpressionAttributeValues={
                        ':date': date_filter
                    },
                    ScanIndexForward=False  # Sort by timestamp descending
                )
                records = response.get('Items', [])
            except Exception as e:
                return _response(500, {'error': f'Error querying records: {str(e)}'})
        else:
            # Scan all records (for date range, we'll filter after)
            try:
                response = table.scan()
                records = response.get('Items', [])
                
                # Handle pagination if needed
                while 'LastEvaluatedKey' in response:
                    response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                    records.extend(response.get('Items', []))
            except Exception as e:
                return _response(500, {'error': f'Error scanning records: {str(e)}'})

        # Filter by checkedBy if provided
        if checked_by_filter:
            records = [r for r in records if r.get('checkedBy', '').lower() == checked_by_filter.lower()]

        # Filter by date range if provided
        if start_date:
            records = [r for r in records if r.get('date', '') >= start_date]
        if end_date:
            records = [r for r in records if r.get('date', '') <= end_date]

        # Sort by date (descending) then timestamp (descending)
        records.sort(key=lambda x: (x.get('date', ''), x.get('timestamp', '')), reverse=True)

        # Apply limit
        records = records[:limit]

        # Convert Decimal objects
        records = convert_decimal(records)

        return _response(200, {
            'records': records,
            'count': len(records)
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
            'limit': '10'
        }
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

