# Hướng dẫn cấu hình API Gateway cho Lambda Checklist POST

## Vấn đề
Nếu Lambda nhận được `body: None`, điều này thường xảy ra khi API Gateway không được cấu hình với **Lambda Proxy Integration**.

## Cách kiểm tra và sửa

### 1. Kiểm tra Integration Type

1. Vào AWS Console → API Gateway
2. Chọn API của bạn
3. Chọn Resource có method `POST` cho checklist endpoint
4. Click vào method `POST`
5. Click vào **Integration Request**

### 2. Cấu hình Integration Request

**Cách 1: Sử dụng Lambda Proxy Integration (Khuyến nghị)**

1. Trong **Integration Request**, kiểm tra:
   - **Integration type**: Phải là `Lambda Function`
   - **Use Lambda Proxy integration**: ✅ **BẬT** (checked)
   - **Lambda Function**: Chọn Lambda function của bạn

2. Nếu checkbox "Use Lambda Proxy integration" **KHÔNG được bật**:
   - ✅ Bật checkbox này
   - Click **Save**
   - Deploy lại API (Actions → Deploy API)

**Cách 2: Nếu không dùng Proxy Integration (Không khuyến nghị)**

Nếu bạn không muốn dùng Lambda Proxy Integration, bạn cần cấu hình **Body Mapping Template**:

1. Trong **Integration Request**, scroll xuống **Body Mapping Templates**
2. Chọn **When there are no templates defined (recommended)**
3. Thêm template cho `application/json`:
   ```json
   {
     "body": "$input.json('$')"
   }
   ```
4. Hoặc nếu bạn muốn map từng field:
   ```json
   {
     "user": "$input.path('$.user')",
     "date": "$input.path('$.date')",
     "shift": "$input.path('$.shift')",
     "tasks": "$input.path('$.tasks')",
     "checklistType": "$input.path('$.checklistType')"
   }
   ```

### 3. Kiểm tra Method Request

1. Trong method `POST`, click **Method Request**
2. Kiểm tra:
   - **HTTP Request Headers**: Có thể thêm `Content-Type` nếu cần
   - **Request Body**: Nếu có, đảm bảo model là `application/json`

### 4. Deploy lại API

Sau khi thay đổi, **bắt buộc phải Deploy lại API**:
1. Click **Actions** → **Deploy API**
2. Chọn Stage (ví dụ: `prod`)
3. Click **Deploy**

### 5. Kiểm tra lại

Sau khi deploy, test lại từ frontend. Lambda sẽ log:
- ✅ `✓ Parsed body from JSON string` nếu nhận được body
- ❌ `⚠⚠⚠ CRITICAL: Body is None` nếu vẫn bị lỗi

## Lưu ý quan trọng

- **Lambda Proxy Integration** là cách đơn giản nhất và được khuyến nghị
- Khi dùng Lambda Proxy Integration, Lambda sẽ nhận toàn bộ request trong `event` object
- Body sẽ nằm trong `event['body']` dưới dạng string JSON
- Headers sẽ nằm trong `event['headers']`

## Troubleshooting

Nếu vẫn gặp vấn đề sau khi cấu hình:

1. Kiểm tra CloudWatch Logs của Lambda để xem event structure
2. Kiểm tra Network tab trong browser để xem request có được gửi đúng không
3. Đảm bảo frontend gửi `Content-Type: application/json` header
4. Đảm bảo frontend gửi body là JSON string (dùng `JSON.stringify()`)

