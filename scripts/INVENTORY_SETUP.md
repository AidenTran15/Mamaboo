# Inventory Management Setup Guide

Hướng dẫn setup hệ thống quản lý nguyên vật liệu với DynamoDB và Lambda.

## Tổng quan

Hệ thống sử dụng **2 DynamoDB tables**:

1. **`inventory_items`** - Lưu thông tin các sản phẩm nguyên vật liệu (danh sách sản phẩm và cấu hình)
2. **`inventory_records`** - Lưu lịch sử kiểm kê và nhập nguyên vật liệu (các lần nhân viên kiểm kê)

## 1. Tạo DynamoDB Tables

### Table 1: inventory_items (Danh sách sản phẩm)

```bash
cd scripts
python create_inventory_items_table.py
```

Table sẽ được tạo với tên `inventory_items`:
- **Primary Key**: `itemId` (String) - ID của sản phẩm (ví dụ: 'ly-500ml', 'matcha-thuong')
- **Billing Mode**: PAY_PER_REQUEST (on-demand)

Sau đó populate dữ liệu từ constants:
```bash
python populate_inventory_items.py
```

### Table 2: inventory_records (Lịch sử kiểm kê)

```bash
python create_inventory_table.py
```

Table sẽ được tạo với tên `inventory_records`:
- **Primary Key**: `date` (String) - ngày kiểm tra (YYYY-MM-DD)
- **Billing Mode**: PAY_PER_REQUEST (on-demand)

## 2. Tạo Lambda Functions

### A. Lambda Functions cho inventory_items (Danh sách sản phẩm)

#### Lambda GET inventory items - Lấy danh sách sản phẩm

```bash
aws lambda create-function \
  --function-name inventory-items-get \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-dynamodb-role \
  --handler lambda_inventory_items_get.lambda_handler \
  --zip-file fileb://lambda_inventory_items_get.zip \
  --region ap-southeast-2
```

**Environment Variables:**
- `INVENTORY_ITEMS_TABLE`: inventory_items
- `AWS_REGION`: ap-southeast-2

**IAM Permissions cần thiết:**
- `dynamodb:Scan` trên table `inventory_items`
- `dynamodb:GetItem` trên table `inventory_items`

#### Lambda POST inventory item - Tạo/cập nhật sản phẩm

```bash
aws lambda create-function \
  --function-name inventory-items-post \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-dynamodb-role \
  --handler lambda_inventory_items_post.lambda_handler \
  --zip-file fileb://lambda_inventory_items_post.zip \
  --region ap-southeast-2
```

**IAM Permissions cần thiết:**
- `dynamodb:GetItem` trên table `inventory_items`
- `dynamodb:PutItem` trên table `inventory_items`

#### Lambda DELETE inventory item - Xóa sản phẩm

```bash
aws lambda create-function \
  --function-name inventory-items-delete \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-dynamodb-role \
  --handler lambda_inventory_items_delete.lambda_handler \
  --zip-file fileb://lambda_inventory_items_delete.zip \
  --region ap-southeast-2
```

**IAM Permissions cần thiết:**
- `dynamodb:GetItem` trên table `inventory_items`
- `dynamodb:DeleteItem` trên table `inventory_items`

### B. Lambda Functions cho inventory_records (Lịch sử kiểm kê)

#### Lambda GET - Lấy danh sách inventory records

```bash
# Tạo Lambda function
aws lambda create-function \
  --function-name inventory-get \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-dynamodb-role \
  --handler lambda_inventory_get.lambda_handler \
  --zip-file fileb://lambda_inventory_get.zip \
  --region ap-southeast-2

# Hoặc update function đã tồn tại
aws lambda update-function-code \
  --function-name inventory-get \
  --zip-file fileb://lambda_inventory_get.zip \
  --region ap-southeast-2
```

**Environment Variables:**
- `INVENTORY_TABLE`: inventory_records
- `AWS_REGION`: ap-southeast-2

**IAM Permissions cần thiết:**
- `dynamodb:Scan` trên table `inventory_records`

### Lambda POST - Tạo/cập nhật inventory record

```bash
aws lambda create-function \
  --function-name inventory-post \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-dynamodb-role \
  --handler lambda_inventory_post.lambda_handler \
  --zip-file fileb://lambda_inventory_post.zip \
  --region ap-southeast-2
```

**IAM Permissions cần thiết:**
- `dynamodb:GetItem` trên table `inventory_records`
- `dynamodb:PutItem` trên table `inventory_records`

### Lambda DELETE - Xóa inventory record

```bash
aws lambda create-function \
  --function-name inventory-delete \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-dynamodb-role \
  --handler lambda_inventory_delete.lambda_handler \
  --zip-file fileb://lambda_inventory_delete.zip \
  --region ap-southeast-2
```

**IAM Permissions cần thiết:**
- `dynamodb:GetItem` trên table `inventory_records`
- `dynamodb:DeleteItem` trên table `inventory_records`

## 3. Tạo API Gateway Endpoints

### A. Endpoints cho inventory_items (Danh sách sản phẩm)

#### GET /inventory-items
- Method: GET
- Integration: Lambda Function `inventory-items-get`
- Query Parameters:
  - `category` (optional): Filter by category (packaging, bot, sot, etc.)
  - `itemId` (optional): Get specific item by ID

#### POST /inventory-items
- Method: POST
- Integration: Lambda Function `inventory-items-post`
- Request Body:
```json
{
  "itemId": "ly-500ml",
  "name": "Ly 500ml",
  "unit": "ống",
  "category": "packaging",
  "categoryName": "PACKAGING",
  "purchaseLink": "https://example.com/ly-500ml",
  "alertThreshold": "20"
}
```

#### DELETE /inventory-items
- Method: DELETE
- Integration: Lambda Function `inventory-items-delete`
- Query Parameters:
  - `itemId` (required): ID of item to delete

### B. Endpoints cho inventory_records (Lịch sử kiểm kê)

#### GET /inventory-records
- Method: GET
- Integration: Lambda Function `inventory-get`
- Query Parameters:
  - `from` (optional): Start date (YYYY-MM-DD)
  - `to` (optional): End date (YYYY-MM-DD)
  - `checkedBy` (optional): Filter by checker name

#### POST /inventory-records
- Method: POST
- Integration: Lambda Function `inventory-post`
- Request Body:
```json
{
  "date": "2025-11-04",
  "checkedBy": "Kim Thu",
  "items": {
    "ly-500ml": "100",
    "ly-700ml": "50"
  },
  "alerts": {
    "ly-500ml": "20"
  }
}
```

#### DELETE /inventory-records
- Method: DELETE
- Integration: Lambda Function `inventory-delete`
- Query Parameters:
  - `date` (required): Date of record to delete (YYYY-MM-DD)

## 4. Test Lambda Functions

### Test Locally

```bash
# Test GET
python lambda_inventory_get.py

# Test POST
python lambda_inventory_post.py

# Test DELETE
python lambda_inventory_delete.py
```

Hoặc test với event files:
```bash
# Test POST
python -c "import json; from lambda_inventory_post import lambda_handler; print(json.dumps(lambda_handler(json.load(open('test_event_inventory_post.json')), None), indent=2, ensure_ascii=False))"

# Test GET
python -c "import json; from lambda_inventory_get import lambda_handler; print(json.dumps(lambda_handler(json.load(open('test_event_inventory_get.json')), None), indent=2, ensure_ascii=False))"

# Test DELETE
python -c "import json; from lambda_inventory_delete import lambda_handler; print(json.dumps(lambda_handler(json.load(open('test_event_inventory_delete.json')), None), indent=2, ensure_ascii=False))"
```

### Test trong Lambda Console

Khi test trong Lambda console, sử dụng các test event files:
- `test_event_inventory_post_lambda_console.json` - cho POST function
- `test_event_inventory_get_lambda_console.json` - cho GET function
- `test_event_inventory_delete_lambda_console.json` - cho DELETE function

**Lưu ý**: Các Lambda functions đã được cập nhật để tự động parse event nếu nó là string JSON, nên bạn có thể paste JSON trực tiếp vào Lambda console test.

## 5. Cấu trúc dữ liệu

### Inventory Record
```json
{
  "date": "2025-11-04",
  "checkedBy": "Kim Thu",
  "items": {
    "ly-500ml": "100",
    "ly-700ml": "50",
    "matcha-thuong": "5"
  },
  "alerts": {
    "ly-500ml": "20",
    "ly-700ml": "15"
  },
  "createdAt": "2025-11-04T09:35:00Z",
  "updatedAt": "2025-11-04T09:35:00Z"
}
```

## 6. Frontend Integration

Cập nhật `constants/api.js` để thêm API endpoints:

```javascript
// API cho inventory_items (danh sách sản phẩm)
export const INVENTORY_ITEMS_GET_API = 'https://YOUR_API_GATEWAY_URL/inventory-items';
export const INVENTORY_ITEMS_POST_API = 'https://YOUR_API_GATEWAY_URL/inventory-items';
export const INVENTORY_ITEMS_DELETE_API = 'https://YOUR_API_GATEWAY_URL/inventory-items';

// API cho inventory_records (lịch sử kiểm kê)
export const INVENTORY_RECORDS_GET_API = 'https://YOUR_API_GATEWAY_URL/inventory-records';
export const INVENTORY_RECORDS_POST_API = 'https://YOUR_API_GATEWAY_URL/inventory-records';
export const INVENTORY_RECORDS_DELETE_API = 'https://YOUR_API_GATEWAY_URL/inventory-records';
```

## 7. Migration từ localStorage

Nếu cần migrate dữ liệu từ localStorage sang DynamoDB, tạo script migration:
```python
# migrate_inventory_to_dynamodb.py
import json
import boto3
from datetime import datetime

# Load từ localStorage export (JSON file)
with open('localStorage_inventory.json', 'r') as f:
    records = json.load(f)

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-2')
table = dynamodb.Table('inventory_records')

for record in records:
    # Convert format
    item = {
        'date': record.get('d') or record.get('date'),
        'checkedBy': record.get('c') or record.get('checkedBy'),
        'items': record.get('i') or record.get('items', {}),
        'createdAt': datetime.now().isoformat() + 'Z',
        'updatedAt': datetime.now().isoformat() + 'Z'
    }
    table.put_item(Item=item)
    print(f"Migrated record for date: {item['date']}")
```

