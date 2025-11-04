# Hướng dẫn Setup Penalty Records với DynamoDB và Lambda

## 1. Tạo DynamoDB Table

Chạy script để tạo bảng `penalty_records`:

```bash
python scripts/create_penalty_table.py
```

## 2. Tạo Lambda Functions

### 2.1 Lambda GET (lấy danh sách penalty records)

- File: `scripts/lambda_penalty_get.py`
- Runtime: Python 3.13
- Environment variables:
  - `PENALTY_TABLE`: `penalty_records` (hoặc để default)
  - `AWS_REGION`: `ap-southeast-2`
- Permissions: DynamoDB read access cho table `penalty_records`

### 2.2 Lambda POST (thêm penalty record)

- File: `scripts/lambda_penalty_post.py`
- Runtime: Python 3.13
- Environment variables:
  - `PENALTY_TABLE`: `penalty_records` (hoặc để default)
  - `AWS_REGION`: `ap-southeast-2`
- Permissions: DynamoDB write access cho table `penalty_records`

### 2.3 Lambda DELETE (xóa penalty record)

- File: `scripts/lambda_penalty_delete.py`
- Runtime: Python 3.13
- Environment variables:
  - `PENALTY_TABLE`: `penalty_records` (hoặc để default)
  - `AWS_REGION`: `ap-southeast-2`
- Permissions: DynamoDB delete access cho table `penalty_records`

## 3. Tạo API Gateway Endpoints

Tạo 3 API Gateway endpoints cho mỗi Lambda function:

1. **GET endpoint**: Gắn với `lambda_penalty_get`
   - Method: GET
   - Query parameters (optional): `staffName`, `from`, `to`, `penaltyLevel`

2. **POST endpoint**: Gắn với `lambda_penalty_post`
   - Method: POST
   - Request body: JSON với các trường: `staffName`, `date`, `penaltyLevel`, `reason`

3. **DELETE endpoint**: Gắn với `lambda_penalty_delete`
   - Method: DELETE
   - Request body: JSON với trường `id` (hoặc query parameter `id`)

## 4. Cập nhật Frontend

Sau khi có API Gateway URLs, cập nhật trong `App.js`:

```javascript
const PENALTY_GET_API = 'https://your-api-gateway-url.execute-api.ap-southeast-2.amazonaws.com/prod';
const PENALTY_POST_API = 'https://your-api-gateway-url.execute-api.ap-southeast-2.amazonaws.com/prod';
const PENALTY_DELETE_API = 'https://your-api-gateway-url.execute-api.ap-southeast-2.amazonaws.com/prod';
```

## 5. Test Events

### Test GET (empty query):
```json
{}
```

### Test POST:
```json
{
  "staffName": "Kim Thu",
  "date": "2025-11-04",
  "penaltyLevel": "1",
  "reason": "Đi trễ nhiều lần"
}
```

### Test DELETE:
```json
{
  "id": "1699123456789"
}
```

## 6. Cấu trúc Item trong DynamoDB

```json
{
  "id": "1699123456789",
  "staffName": "Kim Thu",
  "date": "2025-11-04",
  "penaltyLevel": "1",
  "reason": "Đi trễ nhiều lần",
  "createdAt": "2025-11-04T09:35:00Z"
}
```

## 7. Lưu ý

- Lambda functions tự động xử lý CORS
- Tất cả functions có fallback về localStorage nếu API không available
- Penalty levels: 1, 2, 3, 4, 5 (tương ứng với 50k, 80k, 100k, 150k, 200k VND)

