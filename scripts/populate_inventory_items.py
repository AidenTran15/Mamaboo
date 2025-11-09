import boto3
import json
from datetime import datetime, timezone

"""
Script populate dữ liệu inventory items từ constants/inventory.js vào DynamoDB.
Chạy: python populate_inventory_items.py

Dữ liệu được lấy từ file constants/inventory.js trong frontend.
"""

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-2')
table = dynamodb.Table('inventory_items')

# Dữ liệu từ constants/inventory.js
INVENTORY_CATEGORIES = {
    'packaging': {
        'name': 'PACKAGING',
        'items': [
            {'id': 'tui-dung-ly-doi', 'name': 'Túi đựng ly đôi', 'unit': 'kg', 'purchaseLink': ''},
            {'id': 'tui-dung-ly-don', 'name': 'Túi đựng ly đơn', 'unit': 'kg', 'purchaseLink': ''},
            {'id': 'tui-dung-da', 'name': 'Túi đựng đá', 'unit': 'kg', 'purchaseLink': ''},
            {'id': 'giay-nen', 'name': 'Giấy nến', 'unit': 'bịch', 'purchaseLink': ''},
            {'id': 'ong-hut', 'name': 'Ống hút', 'unit': 'bịch', 'purchaseLink': ''},
            {'id': 'muong', 'name': 'Muỗng', 'unit': 'bịch', 'purchaseLink': ''},
            {'id': 'ly-500ml', 'name': 'Ly 500ml', 'unit': 'ống', 'purchaseLink': 'https://example.com/ly-500ml'},
            {'id': 'ly-700ml', 'name': 'Ly 700ml', 'unit': 'ống', 'purchaseLink': 'https://example.com/ly-700ml'},
            {'id': 'ly-1lit', 'name': 'Ly 1 lít', 'unit': 'ống', 'purchaseLink': 'https://example.com/ly-1lit'},
            {'id': 'nap-phang-sm', 'name': 'Nắp phẳng S,M', 'unit': 'ống', 'purchaseLink': ''},
            {'id': 'nap-cau-sm', 'name': 'Nắp cầu S,M', 'unit': 'ống', 'purchaseLink': ''},
            {'id': 'nap-cau-l', 'name': 'Nắp cầu L', 'unit': 'cái', 'purchaseLink': ''},
            {'id': 'the-tich-diem', 'name': 'Thẻ tích điểm', 'unit': 'hộp', 'purchaseLink': ''},
            {'id': 'bang-keo-co-dinh-ly', 'name': 'Băng keo cố định ly', 'unit': 'cuộn', 'purchaseLink': ''}
        ]
    },
    'guestCheck': {
        'name': 'GUEST CHECK',
        'items': [
            {'id': 'biscoff-ca-he', 'name': 'Biscoff Cà Hê', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'banofee-latte', 'name': 'Banofee Latte', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'tiramisu-ca-he', 'name': 'Tiramisu Cà Hệ', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'salted-caramel-ca-he', 'name': 'Salted Caramel Cà Hê', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'maple-latte', 'name': 'Maple Latte', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'matcha-original', 'name': 'Matcha Original', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'matcha-chuoi-pu-di', 'name': 'Matcha Chúi Pú Đi', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'matcha-rim-bu-le', 'name': 'Matcha Rim Bù Lé', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'matcha-phom-biec', 'name': 'Matcha Phom Biéc', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'matcha-e-gey', 'name': 'Matcha Ê Gêy', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'matcha-zau-te', 'name': 'Matcha Zâu Te', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'matcha-trui', 'name': 'Matcha Trúi', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'matcha-j97', 'name': 'Matcha J97', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'matcha-canada', 'name': 'Matcha Canada', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'matcha-thon', 'name': 'Matcha Thon', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'houjicha-original', 'name': 'Houjicha Original', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'houjicha-chuoi-pu-di', 'name': 'Houjicha Chúi Pú Đi', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'houjicha-phom-biec', 'name': 'Houjicha Phom Biéc', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'houjicha-rim-bu-le', 'name': 'Houjicha Rim Bù Lé', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'houjicha-e-gey', 'name': 'Houjicha Ê Gêy', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'houjicha-carameo', 'name': 'Houjicha Carameo', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'houjicha-j97', 'name': 'Houjicha J97', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'houjicha-canada', 'name': 'Houjicha Canada', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'houjicha-thon', 'name': 'Houjicha Thon', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'cacao-original', 'name': 'Cacao Original', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'cacao-chuoi-pu-di', 'name': 'Cacao Chúi Pú Đi', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'cacao-6-mui', 'name': 'Cacao 6 múi', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'cacao-pmb', 'name': 'Cacao PMB', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'cacao-caramel', 'name': 'Cacao Caramel', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'cacao-rim-bu-le', 'name': 'Cacao Rim Bù Lé', 'unit': 'tờ', 'purchaseLink': ''},
            {'id': 'ori-makiato', 'name': 'Ori Makiato', 'unit': 'tờ', 'purchaseLink': ''}
        ]
    },
    'bot': {
        'name': 'BỘT',
        'items': [
            {'id': 'matcha-thuong', 'name': 'Matcha Thường', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'matcha-premium', 'name': 'Matcha Premium', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'houjicha-thuong', 'name': 'Houjicha Thường', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'houjicha-premium', 'name': 'Houjicha Premium', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'cacao-bot', 'name': 'Cacao', 'unit': 'bịch', 'purchaseLink': ''},
            {'id': 'ca-phe', 'name': 'Cà phê', 'unit': 'bịch', 'purchaseLink': ''}
        ]
    },
    'sot': {
        'name': 'SỐT (BÁO TÌNH TRẠNG)',
        'items': [
            {'id': 'maple-syrup', 'name': 'Maple Syrup', 'unit': 'chai', 'purchaseLink': ''},
            {'id': 'sot-dau', 'name': 'Sốt Dâu', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'sot-caramel', 'name': 'Sốt Caramel', 'unit': 'chai', 'purchaseLink': ''},
            {'id': 'earl-grey', 'name': 'Earl Grey', 'unit': 'chai', 'purchaseLink': ''},
            {'id': 'sot-lotus', 'name': 'Sốt Lotus', 'unit': 'chai', 'purchaseLink': ''},
            {'id': 'hershey-scl', 'name': 'Hershey Scl', 'unit': 'chai', 'purchaseLink': ''},
            {'id': 'sot-chuoi', 'name': 'Sốt Chuối', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'sot-tiramisu', 'name': 'Sốt Tiramisu', 'unit': 'chai', 'purchaseLink': ''}
        ]
    },
    'botFoam': {
        'name': 'BỘT FOAM (BÁO TÌNH TRẠNG)',
        'items': [
            {'id': 'bot-kem-beo', 'name': 'Bột Kem béo', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'bot-whipping-cream', 'name': 'Bột Whipping Cream', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'bot-foam-pho-mai', 'name': 'Bột Foam Phô Mai', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'bot-milk-foam', 'name': 'Bột Milk Foam', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'bot-milk-foam-muoi', 'name': 'Bột Milk Foam Muối', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'bot-hdb', 'name': 'Bột HĐB', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'bot-pudding-trung', 'name': 'Bột Pudding Trứng', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'bot-cream-brulee', 'name': 'Bột Cream Brulee', 'unit': 'hủ', 'purchaseLink': ''}
        ]
    },
    'topping': {
        'name': 'TOPPING',
        'items': [
            {'id': 'dalgona', 'name': 'Dalgona', 'unit': 'bịch', 'purchaseLink': ''},
            {'id': 'tran-chau-dua', 'name': 'Trân Châu Dừa', 'unit': 'bịch', 'purchaseLink': ''},
            {'id': 'panna-cotta', 'name': 'Panna Cotta', 'unit': 'hủ', 'purchaseLink': ''},
            {'id': 'banana-pudding-combo', 'name': 'Banana Pudding combo (Báo tình trạng)', 'unit': 'hộp', 'purchaseLink': ''}
        ]
    },
    'bananaPudding': {
        'name': 'Banana Pudding',
        'items': [
            {'id': 'banana-pudding-s', 'name': 'Banana Pudding size S', 'unit': 'hộp', 'purchaseLink': ''},
            {'id': 'banana-pudding-l', 'name': 'Banana Pudding size L', 'unit': 'hộp', 'purchaseLink': ''}
        ]
    },
    'sua': {
        'name': 'SỮA',
        'items': [
            {'id': 'sua-do', 'name': 'Sữa đỏ', 'unit': 'hộp', 'purchaseLink': ''},
            {'id': 'sua-milklab-bo', 'name': 'Sữa Milklab Bò', 'unit': 'hộp', 'purchaseLink': ''},
            {'id': 'sua-milklab-oat', 'name': 'Sữa Milklab Oat', 'unit': 'hộp', 'purchaseLink': ''},
            {'id': 'boring-milk', 'name': 'Boring Milk', 'unit': 'hộp', 'purchaseLink': ''},
            {'id': 'sua-dac', 'name': 'Sữa đặc', 'unit': 'hộp', 'purchaseLink': ''},
            {'id': 'arla', 'name': 'Arla', 'unit': 'hộp', 'purchaseLink': ''}
        ]
    },
    'cookies': {
        'name': 'COOKIES',
        'items': [
            {'id': 'redvelvet', 'name': 'Redvelvet', 'unit': 'cái', 'purchaseLink': ''},
            {'id': 'double-choco', 'name': 'Double choco', 'unit': 'cái', 'purchaseLink': ''},
            {'id': 'brownie', 'name': 'Brownie', 'unit': 'cái', 'purchaseLink': ''},
            {'id': 'tra-xanh-pho-mai', 'name': 'Trà xanh Phô Mai', 'unit': 'cái', 'purchaseLink': ''},
            {'id': 'salted-caramel-cookie', 'name': 'Salted Caramel', 'unit': 'cái', 'purchaseLink': ''},
            {'id': 'ba-tuoc-vo-cam-pho-mai', 'name': 'Bá tước vỏ cam Phô mai', 'unit': 'cái', 'purchaseLink': ''}
        ]
    },
    'veSinh': {
        'name': 'VỆ SINH (BÁO TÌNH TRẠNG)',
        'items': [
            {'id': 'xa-bong-rua-tay', 'name': 'Xà bông rửa tay', 'unit': 'chai', 'purchaseLink': ''},
            {'id': 'con-rua-tay', 'name': 'Cồn rửa tay', 'unit': 'chai', 'purchaseLink': ''},
            {'id': 'nuoc-rua-chen', 'name': 'Nước rửa chén', 'unit': 'chai', 'purchaseLink': ''},
            {'id': 'nuoc-lau-san', 'name': 'Nước lau sàn', 'unit': 'chai', 'purchaseLink': ''},
            {'id': 'khan-giay', 'name': 'Khăn giấy (báo số lượng)', 'unit': 'bịch', 'purchaseLink': ''},
            {'id': 'binh-xit-phong', 'name': 'Bình xịt phòng', 'unit': 'chai', 'purchaseLink': ''}
        ]
    },
    'others': {
        'name': 'OTHERS (BÁO TÌNH TRẠNG)',
        'items': [
            {'id': 'nuoc-duong', 'name': 'Nước đường', 'unit': 'bình', 'purchaseLink': ''},
            {'id': 'banh-lotus', 'name': 'Bánh Lotus', 'unit': 'gram', 'purchaseLink': ''},
            {'id': 'oreo', 'name': 'Oreo (báo số lượng)', 'unit': 'bịch', 'purchaseLink': ''}
        ]
    }
}

now = datetime.now(timezone.utc).isoformat() + 'Z'

total_items = 0
for category_key, category_data in INVENTORY_CATEGORIES.items():
    category_name = category_data['name']
    items = category_data['items']
    
    for item in items:
        item_id = item['id']
        item_name = item['name']
        unit = item['unit']
        purchase_link = item.get('purchaseLink', '')
        
        # Create item record
        record = {
            'itemId': item_id,
            'name': item_name,
            'unit': unit,
            'category': category_key,
            'categoryName': category_name,
            'purchaseLink': purchase_link,
            'quantity': '0',  # Default quantity = 0
            'alertThreshold': '0',  # Default alert threshold = empty (no alert)
            'createdAt': now,
            'updatedAt': now
        }
        
        try:
            table.put_item(Item=record)
            total_items += 1
            print(f"✅ Added: {item_name} ({item_id})")
        except Exception as e:
            print(f"❌ Error adding {item_name}: {e}")

print(f"\n✅ Done! Total items added: {total_items}")

