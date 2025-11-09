import boto3
from datetime import datetime, timezone

"""
Script tạo bảng 'inventory_records' trên DynamoDB với composite key.
Chạy: python create_inventory_records_table.py

Bảng lưu lịch sử kiểm tra nguyên vật liệu.

Primary key:
- Partition key (date): string → ngày kiểm tra (YYYY-MM-DD)
- Sort key (timestamp): string → ISO timestamp (YYYY-MM-DDTHH:MM:SS.ffffffZ)

Điều này cho phép nhiều lần kiểm tra trong cùng 1 ngày.

Item shape:
{
  'date': '2025-11-04',                    # ngày kiểm tra (YYYY-MM-DD)
  'timestamp': '2025-11-04T09:35:00.123456Z',  # thời gian chính xác
  'checkedBy': 'Kim Thu',                    # người kiểm tra
  'items': {                                 # Map chứa số lượng từng item
    'ly-500ml': '100',
    'ly-700ml': '50',
    ...
  },
  'createdAt': '2025-11-04T09:35:00.123456Z',
  'updatedAt': '2025-11-04T09:35:00.123456Z'
}
"""

dynamodb = boto3.client('dynamodb', region_name='ap-southeast-2')

TABLE_NAME = 'inventory_records'

try:
    resp = dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            {'AttributeName': 'date', 'KeyType': 'HASH'},        # Partition key: date (YYYY-MM-DD)
            {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}    # Sort key: timestamp (ISO format)
        ],
        AttributeDefinitions=[
            {'AttributeName': 'date', 'AttributeType': 'S'},
            {'AttributeName': 'timestamp', 'AttributeType': 'S'},
        ],
        BillingMode='PAY_PER_REQUEST',
    )
    print(f"✅ Bảng '{TABLE_NAME}' đang được tạo. Trạng thái: {resp['TableDescription']['TableStatus']}")
    print(f"   Partition key: date (String)")
    print(f"   Sort key: timestamp (String)")
    print(f"   → Cho phép nhiều lần kiểm tra trong cùng 1 ngày")
except dynamodb.exceptions.ResourceInUseException:
    print(f"⚠ Bảng '{TABLE_NAME}' đã tồn tại.")
    print(f"   Nếu muốn tạo lại với structure mới, hãy xóa bảng cũ trước.")
except Exception as e:
    print(f"❌ Lỗi khi tạo bảng: {e}")

