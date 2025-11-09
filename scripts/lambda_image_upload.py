import json
import os
import boto3
import base64
from datetime import datetime, timezone
from urllib.parse import unquote

"""
Lambda function to upload images to S3 and return public URLs

Request body:
{
  "images": {
    "taskId1": "data:image/jpeg;base64,/9j/4AAQ...",  // base64 image
    "taskId2": "data:image/jpeg;base64,/9j/4AAQ..."
  },
  "user": "Kim Thu",
  "date": "2025-11-09",
  "shift": "toi"
}

Response:
{
  "urls": {
    "taskId1": "https://bucket.s3.amazonaws.com/path/to/image1.jpg",
    "taskId2": "https://bucket.s3.amazonaws.com/path/to/image2.jpg"
  },
  "ok": true
}
"""

S3_BUCKET = os.getenv('S3_BUCKET_NAME', 'mamaboo-checklist-images')
REGION = os.getenv('AWS_REGION', 'ap-southeast-2')

s3_client = boto3.client('s3', region_name=REGION)


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

        images = body.get('images', {})
        if not isinstance(images, dict):
            return _response(400, {'error': 'images must be a dictionary/object'})

        user = body.get('user', 'unknown')
        date = body.get('date', '')
        shift = body.get('shift', '')

        if not date:
            today = datetime.now(timezone.utc)
            date = today.strftime('%Y-%m-%d')

        uploaded_urls = {}
        errors = []

        for task_id, image_data in images.items():
            try:
                if not image_data or not isinstance(image_data, str):
                    continue

                # Parse base64 data URL
                if image_data.startswith('data:image'):
                    # Format: data:image/jpeg;base64,/9j/4AAQ...
                    parts = image_data.split(',')
                    if len(parts) < 2:
                        errors.append(f"Invalid image data format for {task_id}")
                        continue
                    
                    header = parts[0]  # data:image/jpeg;base64
                    base64_data = parts[1]
                    
                    # Extract image type
                    if 'jpeg' in header or 'jpg' in header:
                        content_type = 'image/jpeg'
                        extension = 'jpg'
                    elif 'png' in header:
                        content_type = 'image/png'
                        extension = 'png'
                    elif 'webp' in header:
                        content_type = 'image/webp'
                        extension = 'webp'
                    else:
                        content_type = 'image/jpeg'
                        extension = 'jpg'
                else:
                    # Assume it's raw base64
                    base64_data = image_data
                    content_type = 'image/jpeg'
                    extension = 'jpg'

                # Decode base64
                try:
                    image_bytes = base64.b64decode(base64_data)
                except Exception as e:
                    errors.append(f"Failed to decode base64 for {task_id}: {str(e)}")
                    continue

                # Generate S3 key (path)
                # Format: checklists/{user}/{date}/{shift}/{taskId}_{timestamp}.{ext}
                timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S_%f')
                s3_key = f"checklists/{user}/{date}/{shift}/{task_id}_{timestamp}.{extension}"

                # Upload to S3
                try:
                    # Note: ACL is disabled on bucket, using bucket policy for public access instead
                    s3_client.put_object(
                        Bucket=S3_BUCKET,
                        Key=s3_key,
                        Body=image_bytes,
                        ContentType=content_type
                        # ACL removed - bucket policy handles public access
                    )
                    
                    # Generate public URL
                    public_url = f"https://{S3_BUCKET}.s3.{REGION}.amazonaws.com/{s3_key}"
                    uploaded_urls[task_id] = public_url
                    
                    print(f"Uploaded {task_id} to S3: {s3_key} ({len(image_bytes)} bytes)")
                except Exception as e:
                    error_msg = str(e)
                    if 'NoSuchBucket' in error_msg:
                        errors.append(f"S3 bucket {S3_BUCKET} does not exist. Please create it first.")
                    elif 'AccessDenied' in error_msg:
                        errors.append(f"Access denied to S3 bucket {S3_BUCKET}. Please check IAM permissions.")
                    else:
                        errors.append(f"Failed to upload {task_id} to S3: {error_msg}")
                    continue

            except Exception as e:
                errors.append(f"Error processing {task_id}: {str(e)}")
                continue

        return _response(200, {
            'urls': uploaded_urls,
            'errors': errors,
            'ok': True,
            'count': len(uploaded_urls)
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
            'images': {
                'task1': 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
                'task2': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='
            },
            'user': 'Kim Thu',
            'date': '2025-11-09',
            'shift': 'toi'
        })
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))

