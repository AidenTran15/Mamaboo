# Hướng dẫn Test Events cho Lambda Function `lambda_inventory_items_batch_update`

## Các Test Events có sẵn

### 1. `test_event_inventory_items_batch_update_lambda_console.json`
**Format:** API Gateway format (có `httpMethod` và `body` là string JSON)
**Mục đích:** Test trong Lambda Console với format giống API Gateway
**Nội dung:** 
- 4 items với số lượng
- Có `date` và `checkedBy`

### 2. `test_event_inventory_items_batch_update_api_gateway.json`
**Format:** API Gateway format với headers đầy đủ
**Mục đích:** Test với format giống như request từ frontend
**Nội dung:** 
- Giống test event Lambda console nhưng có thêm headers

### 3. `test_event_inventory_items_batch_update_cors.json`
**Format:** OPTIONS request
**Mục đích:** Test CORS preflight
**Nội dung:** 
- Chỉ có `httpMethod: "OPTIONS"`

### 4. `test_event_inventory_items_batch_update_minimal.json`
**Format:** API Gateway format
**Mục đích:** Test với dữ liệu tối thiểu (chỉ có items, không có date/checkedBy)
**Nội dung:** 
- Chỉ 1 item
- Không có `date` và `checkedBy` (Lambda sẽ tự động dùng ngày hôm nay)

### 5. `test_event_inventory_items_batch_update_empty.json`
**Format:** API Gateway format
**Mục đích:** Test với items rỗng (chỉ lưu record vào inventory_records, không update quantity)
**Nội dung:** 
- `items: {}`
- Có `date` và `checkedBy`

### 6. `test_event_inventory_items_batch_update_multiple.json`
**Format:** API Gateway format
**Mục đích:** Test với nhiều items (giống form thực tế)
**Nội dung:** 
- 18 items từ các category khác nhau
- Có `date` và `checkedBy`

### 7. `test_event_inventory_items_batch_update_direct.json`
**Format:** Direct event (không có `httpMethod`)
**Mục đích:** Test trực tiếp với Lambda (không qua API Gateway)
**Nội dung:** 
- Body trực tiếp, không wrap trong `body` string

## Cách sử dụng trong AWS Lambda Console

1. **Vào Lambda Console** → Chọn function `batch_update_inventory_item`
2. **Click "Test" tab**
3. **Tạo test event mới:**
   - Click "Create new test event"
   - Chọn "JSON"
   - Copy nội dung từ file test event
   - Đặt tên (ví dụ: "test-batch-update")
   - Click "Create"
4. **Chạy test:**
   - Click "Test" button
   - Xem kết quả trong "Execution results"

## Expected Results

### Success Response:
```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  },
  "body": "{\"updated\": [\"ly-500ml\", \"ly-700ml\"], \"created\": [], \"errors\": [], \"ok\": true, \"count\": 2}"
}
```

### Error Response:
```json
{
  "statusCode": 400,
  "headers": {...},
  "body": "{\"error\": \"items must be a dictionary/object\"}"
}
```

## Lưu ý

1. **Đảm bảo table tồn tại:**
   - `inventory_items` table phải có các items với `itemId` tương ứng
   - `inventory_records` table phải được tạo (có thể bỏ qua nếu chưa có)

2. **Environment Variables:**
   - `INVENTORY_ITEMS_TABLE`: `inventory_items`
   - `INVENTORY_TABLE`: `inventory_records`
   - `AWS_REGION`: `ap-southeast-2`

3. **IAM Permissions:**
   - Lambda function cần quyền `dynamodb:GetItem`, `dynamodb:UpdateItem` trên `inventory_items`
   - Lambda function cần quyền `dynamodb:PutItem` trên `inventory_records`

## Troubleshooting

- **ResourceNotFoundException:** Table chưa được tạo → Chạy script tạo table
- **AccessDeniedException:** Lambda không có quyền → Cập nhật IAM role
- **ValidationException:** Format không đúng → Kiểm tra JSON structure
- **Empty updated array:** Số lượng không thay đổi → Lambda sẽ skip update nếu quantity giống nhau

