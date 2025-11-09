import boto3

"""
Script tạo bảng 'inventory_items' trên DynamoDB.
Chạy: python create_inventory_items_table.py

Bảng lưu thông tin các sản phẩm nguyên vật liệu (danh sách sản phẩm và cấu hình).

Primary key:
- Partition key (itemId): string → ID của sản phẩm (ví dụ: 'ly-500ml', 'matcha-thuong')

Suggested item shape:
{
  'itemId': 'ly-500ml',                    # ID của sản phẩm (unique)
  'name': 'Ly 500ml',                       # Tên sản phẩm
  'unit': 'ống',                            # Đơn vị tính
  'category': 'packaging',                  # Danh mục (packaging, bot, sot, etc.)
  'categoryName': 'PACKAGING',              # Tên danh mục hiển thị
  'purchaseLink': 'https://example.com/...', # Link mua hàng (optional)
  'alertThreshold': '20',                   # Ngưỡng cảnh báo (optional)
  'createdAt': '2025-11-04T09:35:00Z',
  'updatedAt': '2025-11-04T09:35:00Z'
}

Note: Table này lưu danh sách sản phẩm, không phải lịch sử kiểm kê.
Lịch sử kiểm kê được lưu trong table 'inventory_records'.
"""

dynamodb = boto3.client('dynamodb', region_name='ap-southeast-2')

TABLE_NAME = 'inventory_items'

try:
    resp = dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            {'AttributeName': 'itemId', 'KeyType': 'HASH'}  # Partition key: itemId
        ],
        AttributeDefinitions=[
            {'AttributeName': 'itemId', 'AttributeType': 'S'},
        ],
        BillingMode='PAY_PER_REQUEST',
    )
    print(f"Bảng '{TABLE_NAME}' đang được tạo. Trạng thái: {resp['TableDescription']['TableStatus']}")
    print(f"   Primary Key: itemId (String)")
except dynamodb.exceptions.ResourceInUseException:
    print(f"Bảng '{TABLE_NAME}' đã tồn tại.")
except Exception as e:
    print(f"Lỗi khi tạo bảng: {e}")

