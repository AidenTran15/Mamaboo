import json
import os
import boto3

"""
Lambda DELETE overtime record

Query parameter:
- id: record ID to delete

Returns success status.
"""

TABLE_NAME = os.getenv('OVERTIME_TABLE', 'overtime_records')
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
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return _response(200, {'ok': True})

    try:
        # Parse query parameters
        # Support multiple formats: API Gateway, direct test, and path parameters
        record_id = None
        
        # Debug logging
        print(f"Full event: {json.dumps(event, default=str)}")
        print(f"Event keys: {list(event.keys()) if isinstance(event, dict) else 'not a dict'}")
        print(f"Event type: {type(event)}")
        
        if isinstance(event, dict):
            # PRIORITY 1: Try body first (most reliable for DELETE with body)
            body_raw = event.get('body')
            if body_raw:
                print(f"Body raw: {body_raw}, type: {type(body_raw)}")
                if isinstance(body_raw, str):
                    try:
                        body = json.loads(body_raw)
                        if isinstance(body, dict) and 'id' in body:
                            record_id = body.get('id')
                            print(f"Found ID in body (string): {record_id}")
                    except Exception as e:
                        print(f"Error parsing body string: {e}")
                elif isinstance(body_raw, dict):
                    record_id = body_raw.get('id')
                    if record_id:
                        print(f"Found ID in body dict: {record_id}")
            
            # PRIORITY 2: Try direct test format (event.id at root level)
            if not record_id:
                record_id = event.get('id')
                if record_id:
                    print(f"Found ID at root level: {record_id}")
            
            # PRIORITY 3: Try rawQueryString (API Gateway v2 format or raw query string)
            if not record_id:
                raw_query = event.get('rawQueryString') or event.get('queryString')
                if raw_query:
                    print(f"rawQueryString: {raw_query}")
                    import urllib.parse
                    parsed = urllib.parse.parse_qs(raw_query)
                    if 'id' in parsed:
                        record_id = parsed['id'][0] if isinstance(parsed['id'], list) else parsed['id']
                        print(f"Found ID in rawQueryString: {record_id}")
            
            # PRIORITY 4: Try API Gateway format: queryStringParameters
            if not record_id:
                params = event.get('queryStringParameters')
                if params:
                    print(f"queryStringParameters: {params}")
                    if isinstance(params, dict):
                        record_id = params.get('id')
                        if record_id:
                            print(f"Found ID in queryStringParameters dict: {record_id}")
                    elif isinstance(params, str):
                        # Sometimes queryStringParameters is a string that needs parsing
                        import urllib.parse
                        parsed = urllib.parse.parse_qs(params)
                        if 'id' in parsed:
                            record_id = parsed['id'][0] if isinstance(parsed['id'], list) else parsed['id']
                            print(f"Found ID in queryStringParameters string: {record_id}")
            
            # PRIORITY 5: Try multiValueQueryStringParameters (for multiple values)
            if not record_id:
                multi_params = event.get('multiValueQueryStringParameters')
                if multi_params and isinstance(multi_params, dict) and 'id' in multi_params:
                    record_id = multi_params['id'][0] if isinstance(multi_params['id'], list) else multi_params['id']
                    if record_id:
                        print(f"Found ID in multiValueQueryStringParameters: {record_id}")
            
            # PRIORITY 6: Try pathParameters (if ID is in the path)
            if not record_id:
                path_params = event.get('pathParameters')
                if path_params and isinstance(path_params, dict):
                    record_id = path_params.get('id')
                    if record_id:
                        print(f"Found ID in pathParameters: {record_id}")
            
            # PRIORITY 7: Try requestContext (sometimes query string is here)
            if not record_id:
                request_context = event.get('requestContext')
                if request_context:
                    if isinstance(request_context, dict):
                        # Try to get from query string in request context
                        if 'http' in request_context:
                            query_string = request_context['http'].get('queryString')
                            if query_string:
                                import urllib.parse
                                parsed = urllib.parse.parse_qs(query_string)
                                if 'id' in parsed:
                                    record_id = parsed['id'][0] if isinstance(parsed['id'], list) else parsed['id']
                                    print(f"Found ID in requestContext: {record_id}")

        # If still not found and event is a string, treat it as the ID
        if not record_id and isinstance(event, str):
            record_id = event

        print(f"Extracted record_id: {record_id}")

        # Validate and clean record_id
        if not record_id:
            return _response(400, {'error': 'id is required', 'debug': {'event_keys': list(event.keys()) if isinstance(event, dict) else None}})
        
        record_id = str(record_id).strip()
        if not record_id:
            return _response(400, {'error': 'id is required'})

        # Delete item
        table.delete_item(Key={'id': record_id})

        return _response(200, {'ok': True, 'id': record_id})

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
            'id': '1699123456789'
        }
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

