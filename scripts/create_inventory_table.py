import boto3

"""
Script tạo bảng 'inventory_records' trên DynamoDB.
Chạy: python create_inventory_table.py

Bảng lưu lịch sử kiểm tra nguyên vật liệu.

Primary key:
- Partition key (date): string → ngày kiểm tra (YYYY-MM-DD)

Suggested item shape:
{
  'date': '2025-11-04',                    # ngày kiểm tra (YYYY-MM-DD)
  'checkedBy': 'Kim Thu',                  # người kiểm tra
  'items': {                                # Map chứa số lượng từng item
    'ly-500ml': '100',
    'ly-700ml': '50',
    ...
  },
  'alerts': {                               # Map chứa alert thresholds (optional)
    'ly-500ml': '20',
    ...
  },
  'createdAt': '2025-11-04T09:35:00Z',
  'updatedAt': '2025-11-04T09:35:00Z'
}

Note: Mỗi ngày chỉ có 1 bản ghi kiểm tra, nếu cập nhật sẽ overwrite.
"""

dynamodb = boto3.client('dynamodb', region_name='ap-southeast-2')

TABLE_NAME = 'inventory_records'

try:
    resp = dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            {'AttributeName': 'date', 'KeyType': 'HASH'}  # Partition key: date (YYYY-MM-DD)
        ],
        AttributeDefinitions=[
            {'AttributeName': 'date', 'AttributeType': 'S'},
        ],
        BillingMode='PAY_PER_REQUEST',
    )
    print(f"Bảng '{TABLE_NAME}' đang được tạo. Trạng thái: {resp['TableDescription']['TableStatus']}")
except dynamodb.exceptions.ResourceInUseException:
    print(f"Bảng '{TABLE_NAME}' đã tồn tại.")
except Exception as e:
    print(f"Lỗi khi tạo bảng: {e}")

