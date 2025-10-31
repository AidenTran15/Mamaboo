import boto3

"""
Script tạo bảng 'roster' trên DynamoDB.
Chạy: python create_roster_table.py
Bảng sẽ có partition key là 'date' (dạng chuỗi 'yyyy-mm-dd').
Các trường ca: sang, trua, toi là các thông tin nhân viên phân ca theo ngày, dạng string hoặc list.
"""

dynamodb = boto3.client('dynamodb', region_name='ap-southeast-2')

TABLE_NAME = 'roster'

try:
    resp = dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            {'AttributeName': 'date', 'KeyType': 'HASH'}  # Partition key: ngày
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
