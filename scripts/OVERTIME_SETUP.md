# Hướng dẫn setup Overtime Records với DynamoDB

## Bước 1: Tạo bảng DynamoDB

Chạy script để tạo bảng `overtime_records`:

```bash
python scripts/create_overtime_table.py
```

Bảng sẽ có:
- **Partition key**: `id` (string) - unique ID cho mỗi record
- **Billing mode**: PAY_PER_REQUEST

## Bước 2: Tạo Lambda Functions

Có 3 Lambda functions cần tạo:

### 2.1. Lambda GET (lambda_overtime_get.py)

- **Function name**: `overtime-records-get`
- **Handler**: `lambda_function.lambda_handler`
- **Runtime**: Python 3.9 hoặc cao hơn
- **Environment variables**:
  - `OVERTIME_TABLE`: `overtime_records`
  - `AWS_REGION`: `ap-southeast-2`
- **IAM Role**: Cần quyền `dynamodb:Scan` cho bảng `overtime_records`

### 2.2. Lambda POST (lambda_overtime_post.py)

- **Function name**: `overtime-records-post`
- **Handler**: `lambda_function.lambda_handler`
- **Runtime**: Python 3.9 hoặc cao hơn
- **Environment variables**:
  - `OVERTIME_TABLE`: `overtime_records`
  - `AWS_REGION`: `ap-southeast-2`
- **IAM Role**: Cần quyền `dynamodb:PutItem` cho bảng `overtime_records`

### 2.3. Lambda DELETE (lambda_overtime_delete.py)

- **Function name**: `overtime-records-delete`
- **Handler**: `lambda_function.lambda_handler`
- **Runtime**: Python 3.9 hoặc cao hơn
- **Environment variables**:
  - `OVERTIME_TABLE`: `overtime_records`
  - `AWS_REGION`: `ap-southeast-2`
- **IAM Role**: Cần quyền `dynamodb:DeleteItem` cho bảng `overtime_records`

## Bước 3: Tạo API Gateway

Tạo 3 API endpoints trong API Gateway:

1. **GET** `/overtime-records` → `overtime-records-get`
2. **POST** `/overtime-records` → `overtime-records-post`
3. **DELETE** `/overtime-records` → `overtime-records-delete`

Đảm bảo:
- Enable CORS cho tất cả endpoints
- Methods: GET, POST, DELETE, OPTIONS
- Headers: `Access-Control-Allow-Origin: *`

## Bước 4: Cập nhật API URLs trong React

Sau khi deploy, cập nhật các constants trong `mamaboo-app/src/App.js`:

```javascript
const OVERTIME_GET_API = 'https://YOUR_API_GATEWAY_URL.execute-api.ap-southeast-2.amazonaws.com/prod/overtime-records';
const OVERTIME_POST_API = 'https://YOUR_API_GATEWAY_URL.execute-api.ap-southeast-2.amazonaws.com/prod/overtime-records';
const OVERTIME_DELETE_API = 'https://YOUR_API_GATEWAY_URL.execute-api.ap-southeast-2.amazonaws.com/prod/overtime-records';
```

Thay `YOUR_API_GATEWAY_URL` bằng URL thực tế từ API Gateway.

## Bước 5: Migrate dữ liệu từ localStorage (nếu có)

Nếu đã có dữ liệu trong localStorage, có thể migrate bằng cách:

1. Export dữ liệu từ localStorage:
   ```javascript
   const records = JSON.parse(localStorage.getItem('overtimeRecords'));
   console.log(JSON.stringify(records, null, 2));
   ```

2. Post từng record lên API hoặc dùng script Python để bulk import.

## Lưu ý

- Code React đã có fallback về localStorage nếu API chưa được cấu hình hoặc gặp lỗi
- Dữ liệu sẽ được sync giữa API và localStorage để đảm bảo tương thích ngược
- Khi API đã hoạt động, dữ liệu sẽ được lưu vào DynamoDB và có thể truy cập từ bất kỳ thiết bị nào

