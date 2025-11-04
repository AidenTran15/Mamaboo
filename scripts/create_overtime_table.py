import boto3

"""
Script tạo bảng 'overtime_records' trên DynamoDB.
Chạy: python create_overtime_table.py

Bảng lưu lịch sử tăng ca và đi trễ của nhân viên.

Primary key:
- Partition key (id): string → unique ID (timestamp hoặc UUID)

Suggested item shape:
{
  'id': '1699123456789',           # unique ID (timestamp)
  'staffName': 'Kim Thu',           # tên nhân viên
  'date': '2025-11-04',             # ngày (YYYY-MM-DD)
  'shift': 'sang',                  # ca: sang|trua|toi
  'type': 'overtime',                # loại: overtime|late
  'hours': 2,                       # số giờ (tăng ca) hoặc số lần (đi trễ)
  'createdAt': '2025-11-04T09:35:00Z'
}
"""

dynamodb = boto3.client('dynamodb', region_name='ap-southeast-2')

TABLE_NAME = 'overtime_records'

try:
    resp = dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            {'AttributeName': 'id', 'KeyType': 'HASH'}  # Partition key: unique ID
        ],
        AttributeDefinitions=[
            {'AttributeName': 'id', 'AttributeType': 'S'},
        ],
        BillingMode='PAY_PER_REQUEST',
    )
    print(f"Bảng '{TABLE_NAME}' đang được tạo. Trạng thái: {resp['TableDescription']['TableStatus']}")
except dynamodb.exceptions.ResourceInUseException:
    print(f"Bảng '{TABLE_NAME}' đã tồn tại.")
except Exception as e:
    print(f"Lỗi khi tạo bảng: {e}")

