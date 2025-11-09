# Hướng dẫn setup Lambda GET cho Inventory Records

## Lambda Function: `lambda_inventory_records_get.py`

## Chức năng
Lấy lịch sử kiểm kê nguyên vật liệu từ table `inventory_records`.

## Query Parameters (tất cả đều optional)

- `date`: Lọc theo ngày cụ thể (YYYY-MM-DD)
- `checkedBy`: Lọc theo người kiểm tra
- `limit`: Số lượng records tối đa (mặc định: 100)
- `startDate`: Lọc từ ngày này trở đi (YYYY-MM-DD)
- `endDate`: Lọc đến ngày này (YYYY-MM-DD)

## Response Format

```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
  },
  "body": "{\"records\": [...], \"count\": 10}"
}
```

## Bước 1: Deploy Lambda Function

1. Vào AWS Lambda Console
2. Tạo function mới hoặc chọn function hiện có
3. Upload file `lambda_inventory_records_get.py`
4. Set handler: `lambda_function.lambda_handler`
5. Set environment variables:
   - `INVENTORY_TABLE`: `inventory_records`
   - `AWS_REGION`: `ap-southeast-2`

## Bước 2: Cấu hình IAM Permissions

Lambda function cần quyền:
- `dynamodb:Query` trên table `inventory_records` (partition key: date)
- `dynamodb:Scan` trên table `inventory_records`

## Bước 3: Tạo API Gateway

1. Tạo REST API mới hoặc dùng API hiện có
2. Tạo resource và method GET
3. Integration: Lambda Function
4. Enable CORS
5. Deploy API

## Bước 4: Cập nhật Frontend

Sau khi có API Gateway URL, cập nhật trong `mamaboo-app/src/constants/api.js`:

```javascript
export const INVENTORY_RECORDS_GET_API = 'YOUR_API_GATEWAY_URL';
```

## Test Events

Có sẵn các test events:
- `test_event_inventory_records_get_lambda_console.json` - Test cơ bản
- `test_event_inventory_records_get_by_date.json` - Test lọc theo ngày
- `test_event_inventory_records_get_by_checkedBy.json` - Test lọc theo người kiểm tra

## Frontend Component

Component `InventoryHistory.js` đã được tạo sẵn với:
- Hiển thị danh sách lịch sử kiểm kê
- Filter theo ngày và người kiểm tra
- Hiển thị chi tiết từng lần kiểm tra (ngày, giờ, người kiểm tra, danh sách items)
- Nút "Lịch sử kiểm kê" đã được thêm vào trang `InventoryManagement`

## Route

Route đã được thêm: `/inventory-history`

