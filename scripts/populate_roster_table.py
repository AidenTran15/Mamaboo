import boto3
from datetime import datetime, timedelta

"""
Script để populate dữ liệu mẫu vào bảng 'roster' trên DynamoDB.
Chạy: python populate_roster_table.py
Yêu cầu bảng đã được tạo trước đó.
"""

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-2')
table = dynamodb.Table('roster')

# Dữ liệu mẫu nhân viên
nhan_viens = [
    ['kiett'],
    ['A Linh'],
    ['Tran Thanh'],
    ['kiett', 'A Linh'],
    ['A Linh', 'Tran Thanh'],
    ['kiett', 'Tran Thanh'],
]

# Populate cho 7 ngày liên tiếp từ ngày hôm nay
base_date = datetime.now()
for i in range(7):
    d = base_date + timedelta(days=i)
    date_str = d.strftime('%Y-%m-%d')
    item = {
        'date': date_str,
        'sang': nhan_viens[i % len(nhan_viens)],
        'trua': nhan_viens[(i+1) % len(nhan_viens)],
        'toi': nhan_viens[(i+2) % len(nhan_viens)],
    }
    table.put_item(Item=item)
    print(f"Đã thêm roster cho ngày {date_str}: {item}")
print('Đã populate xong dữ liệu mẫu.')
