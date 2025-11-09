# Inventory Lambda IAM Permissions Setup

Hướng dẫn setup IAM permissions cho các Lambda functions quản lý inventory.

## Vấn đề thường gặp

Nếu gặp lỗi `AccessDeniedException` khi gọi DynamoDB operations, có thể do:
1. Lambda function chưa được gán đúng IAM role
2. IAM role thiếu permissions cho DynamoDB table `inventory_records`
3. Permissions chưa được propagate (cần đợi vài phút)

## Giải pháp

### Option 1: Sử dụng AWS Managed Policy (Khuyến nghị)

Attach policy `AmazonDynamoDBFullAccess` vào Lambda execution role:

```bash
# Lấy role name từ Lambda function
aws lambda get-function-configuration \
  --function-name inventory-post \
  --region ap-southeast-2 \
  --query 'Role' \
  --output text

# Attach policy (thay YOUR_ROLE_NAME bằng role name từ command trên)
aws iam attach-role-policy \
  --role-name YOUR_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess \
  --region ap-southeast-2
```

### Cách 2: Sử dụng AWS CLI để attach inline policy

```bash
# Attach inline policy cho role
aws iam put-role-policy \
  --role-name post_inventory-role-s8meaygv \
  --policy-name InventoryRecordsAccess \
  --policy-document file://inventory_dynamodb_policy.json \
  --region ap-southeast-2
```

Hoặc sử dụng script tự động:
```bash
python attach_inventory_permissions.py
```

### Option 3: Verify Lambda Function đang dùng đúng Role

Kiểm tra Lambda function có đang dùng đúng role không:

```bash
# Check role của Lambda function
aws lambda get-function-configuration \
  --function-name inventory-post \
  --region ap-southeast-2 \
  --query 'Role' \
  --output text

# Nếu role không đúng, update:
aws lambda update-function-configuration \
  --function-name inventory-post \
  --role arn:aws:iam::493885330050:role/service-role/post_inventory-role-s8meaygv \
  --region ap-southeast-2
```

## Permissions cần thiết cho từng Lambda function

### inventory-post (POST)
- `dynamodb:PutItem` trên table `inventory_records`
- `dynamodb:GetItem` trên table `inventory_records` (để check existing record)

### inventory-get (GET)
- `dynamodb:Scan` trên table `inventory_records`

### inventory-delete (DELETE)
- `dynamodb:GetItem` trên table `inventory_records` (để check existing)
- `dynamodb:DeleteItem` trên table `inventory_records`

## Troubleshooting

### 1. Kiểm tra role đã có permissions chưa

```bash
# List policies attached to role
aws iam list-attached-role-policies \
  --role-name post_inventory-role-s8meaygv \
  --region ap-southeast-2

# List inline policies
aws iam list-role-policies \
  --role-name post_inventory-role-s8meaygv \
  --region ap-southeast-2
```

### 2. Test permissions với AWS CLI

```bash
# Test PutItem (cần có permissions)
aws dynamodb put-item \
  --table-name inventory_records \
  --item '{"date":{"S":"2025-11-04"},"checkedBy":{"S":"Test"},"items":{"M":{}}}' \
  --region ap-southeast-2
```

### 3. Đợi permissions propagate

Sau khi attach policy, đợi 1-2 phút để AWS propagate permissions, sau đó test lại Lambda function.

### 4. Check CloudWatch Logs

Xem CloudWatch Logs của Lambda function để xem chi tiết lỗi:
- Vào Lambda Console → Function → Monitor tab → View CloudWatch logs

## Quick Fix Script

Tạo script để tự động attach permissions:

```python
# attach_inventory_permissions.py
import boto3
import json

LAMBDA_FUNCTIONS = ['inventory-post', 'inventory-get', 'inventory-delete']
REGION = 'ap-southeast-2'

lambda_client = boto3.client('lambda', region_name=REGION)
iam = boto3.client('iam')

# Inline policy cho inventory table
INLINE_POLICY = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Scan",
                "dynamodb:Query"
            ],
            "Resource": [
                f"arn:aws:dynamodb:{REGION}:*:table/inventory_records",
                f"arn:aws:dynamodb:{REGION}:*:table/inventory_records/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        }
    ]
}

for func_name in LAMBDA_FUNCTIONS:
    try:
        # Get Lambda function configuration
        func_config = lambda_client.get_function_configuration(FunctionName=func_name)
        role_arn = func_config['Role']
        
        # Extract role name from ARN
        role_name = role_arn.split('/')[-1]
        
        print(f"Processing {func_name} with role {role_name}...")
        
        # Attach inline policy
        policy_name = f'InventoryDynamoDBAccess-{func_name}'
        iam.put_role_policy(
            RoleName=role_name,
            PolicyName=policy_name,
            PolicyDocument=json.dumps(INLINE_POLICY)
        )
        
        print(f"✅ Attached inline policy '{policy_name}' to role '{role_name}'")
        
    except Exception as e:
        print(f"❌ Error processing {func_name}: {e}")

print("\n✅ Done! Wait 1-2 minutes for permissions to propagate, then test Lambda functions.")
```

Chạy script:
```bash
python attach_inventory_permissions.py
```

