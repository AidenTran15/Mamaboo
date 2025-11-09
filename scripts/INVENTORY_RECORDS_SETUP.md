# Hướng dẫn setup Inventory Records Table

## Mục đích
Lưu lịch sử các lần nhân viên kiểm tra nguyên vật liệu trên trang `/inventory-check` (không phải form trong checklist).

## Cấu trúc Table

**Table name:** `inventory_records`

**Primary Key:**
- Partition key: `date` (String) - Ngày kiểm tra (YYYY-MM-DD)
- Sort key: `timestamp` (String) - Thời gian chính xác (ISO format: YYYY-MM-DDTHH:MM:SS.ffffffZ)

**Cho phép:** Nhiều lần kiểm tra trong cùng 1 ngày (mỗi lần có timestamp khác nhau)

**Item structure:**
```json
{
  "date": "2025-11-04",
  "timestamp": "2025-11-04T09:35:00.123456Z",
  "checkedBy": "Kim Thu",
  "items": {
    "ly-500ml": "100",
    "ly-700ml": "50",
    "matcha-thuong": "5"
  },
  "createdAt": "2025-11-04T09:35:00.123456Z",
  "updatedAt": "2025-11-04T09:35:00.123456Z"
}
```

## Bước 1: Tạo Table

```bash
cd scripts
python create_inventory_records_table.py
```

**Lưu ý:** 
- Nếu table `inventory_records` đã tồn tại với structure cũ (chỉ có partition key `date`), bạn cần:
  1. Xóa table cũ trong AWS Console
  2. Chạy script mới để tạo table với composite key

## Bước 2: Deploy Lambda Function

Lambda function `lambda_inventory_items_batch_update.py` đã được cập nhật để:
- Lưu `timestamp` vào table `inventory_records`
- Hỗ trợ nhiều lần kiểm tra trong cùng 1 ngày

**Deploy:**
1. Vào AWS Lambda Console
2. Tìm function `batch_update_inventory_item` (hoặc tên tương ứng)
3. Upload file `lambda_inventory_items_batch_update.py` mới
4. Đảm bảo environment variables:
   - `INVENTORY_ITEMS_TABLE`: `inventory_items`
   - `INVENTORY_TABLE`: `inventory_records`
   - `AWS_REGION`: `ap-southeast-2`

## Bước 3: Kiểm tra IAM Permissions

Lambda function cần quyền:
- `dynamodb:PutItem` trên table `inventory_records`
- `dynamodb:GetItem` trên table `inventory_items`
- `dynamodb:UpdateItem` trên table `inventory_items`

## Bước 4: Test

1. Vào trang nhân viên → Click "Kiểm tra nguyên vật liệu"
2. Điền form và submit
3. Kiểm tra trong DynamoDB Console:
   - Table `inventory_records`
   - Tìm record với `date` = hôm nay
   - Kiểm tra có `timestamp`, `checkedBy`, và `items`

## Lưu ý

- Form trên trang `/inventory-check` đã tự động gửi `date` và `checkedBy` trong request
- Lambda function sẽ tự động thêm `timestamp` khi lưu vào table
- Mỗi lần submit form sẽ tạo 1 record mới (không overwrite)

