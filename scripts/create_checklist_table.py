import boto3

"""
Creates DynamoDB table 'checklist' to store employees' daily checklists.

Primary key:
- Partition key  (user)       : string   → username/login (e.g., "Kim Thu")
- Sort key       (date_shift) : string   → format: YYYY-MM-DD#sang|trua|toi

Suggested item shape:
{
  'user': 'Kim Thu',
  'date_shift': '2025-11-04#sang',
  'date': '2025-11-04',
  'shift': 'sang',                 # sang|trua|toi
  'tasks': {                       # map of taskId -> { done: bool, imageUrl: string }
    'bar':   { 'done': True,  'imageUrl': 'https://s3/.../bar.jpg' },
    'wc':    { 'done': False, 'imageUrl': '' },
    'fridge':{ 'done': True,  'imageUrl': 'https://s3/.../fridge.jpg' },
    'cash':  { 'done': True,  'imageUrl': 'https://s3/.../cash.jpg' }
  },
  'createdAt': '2025-11-04T09:35:00Z',
  'updatedAt': '2025-11-04T13:50:00Z'
}

Note: For images, it's recommended to upload to S3 and save the URL here.
"""

dynamodb = boto3.client('dynamodb', region_name='ap-southeast-2')

TABLE_NAME = 'checklist'

try:
    resp = dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            { 'AttributeName': 'user', 'KeyType': 'HASH' },      # partition key
            { 'AttributeName': 'date_shift', 'KeyType': 'RANGE' } # sort key
        ],
        AttributeDefinitions=[
            { 'AttributeName': 'user', 'AttributeType': 'S' },
            { 'AttributeName': 'date_shift', 'AttributeType': 'S' },
        ],
        BillingMode='PAY_PER_REQUEST',
    )
    print(f"Bảng '{TABLE_NAME}' đang được tạo. Trạng thái: {resp['TableDescription']['TableStatus']}")
except dynamodb.exceptions.ResourceInUseException:
    print(f"Bảng '{TABLE_NAME}' đã tồn tại.")
except Exception as e:
    print(f"Lỗi khi tạo bảng: {e}")
