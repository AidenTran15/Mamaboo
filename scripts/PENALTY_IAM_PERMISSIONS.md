# Hướng dẫn cấu hình IAM Permissions cho Penalty Lambda Functions

## Vấn đề
Lambda function không có quyền truy cập DynamoDB table `penalty_records`, dẫn đến lỗi `AccessDeniedException`.

## Giải pháp

### Bước 1: Xác định Lambda Execution Role

Từ error message, role name là: `get_penalty-role-j489ytuz`

Tương tự, bạn cần tìm role cho:
- POST Lambda function
- DELETE Lambda function

### Bước 2: Thêm IAM Policy cho từng Lambda

#### 1. GET Lambda (chỉ cần đọc)

Policy JSON:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:GetItem"
            ],
            "Resource": "arn:aws:dynamodb:ap-southeast-2:493885330050:table/penalty_records"
        }
    ]
}
```

#### 2. POST Lambda (cần ghi)

Policy JSON:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem"
            ],
            "Resource": "arn:aws:dynamodb:ap-southeast-2:493885330050:table/penalty_records"
        }
    ]
}
```

#### 3. DELETE Lambda (cần xóa)

Policy JSON:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:DeleteItem"
            ],
            "Resource": "arn:aws:dynamodb:ap-southeast-2:493885330050:table/penalty_records"
        }
    ]
}
```

## Cách thêm Policy qua AWS Console

### Phương pháp 1: Thêm Inline Policy (Khuyến nghị)

1. Vào **IAM Console** → **Roles**
2. Tìm role của Lambda function (ví dụ: `get_penalty-role-j489ytuz`)
3. Click vào role
4. Tab **Permissions** → Click **Add permissions** → **Create inline policy**
5. Chọn tab **JSON**, paste policy JSON tương ứng
6. Click **Review policy**
7. Đặt tên policy (ví dụ: `PenaltyRecordsReadAccess`)
8. Click **Create policy**

### Phương pháp 2: Sử dụng AWS CLI

```bash
# Cho GET Lambda
aws iam put-role-policy \
  --role-name get_penalty-role-j489ytuz \
  --policy-name PenaltyRecordsReadAccess \
  --policy-document file://penalty_get_policy.json

# Cho POST Lambda (thay role name)
aws iam put-role-policy \
  --role-name <post-lambda-role-name> \
  --policy-name PenaltyRecordsWriteAccess \
  --policy-document file://penalty_post_policy.json

# Cho DELETE Lambda (thay role name)
aws iam put-role-policy \
  --role-name <delete-lambda-role-name> \
  --policy-name PenaltyRecordsDeleteAccess \
  --policy-document file://penalty_delete_policy.json
```

## Kiểm tra lại

Sau khi thêm policy, test lại Lambda function:
- GET Lambda: Dùng test event `{}` (empty)
- POST Lambda: Dùng test event từ `test_event_penalty_post.json`
- DELETE Lambda: Dùng test event với `id` hợp lệ

## Lưu ý

- **Resource ARN**: Đảm bảo Account ID và Region đúng
- **Table name**: Phải khớp với tên table trong DynamoDB (case-sensitive)
- **Actions**: Chỉ cấp quyền tối thiểu cần thiết (principle of least privilege)

## Troubleshooting

Nếu vẫn gặp lỗi sau khi thêm policy:
1. Đợi vài giây để IAM policy propagate
2. Kiểm tra lại Resource ARN có đúng không
3. Kiểm tra table name có đúng không
4. Xem CloudWatch Logs để debug chi tiết

