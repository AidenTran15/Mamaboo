#!/bin/bash

# Script để thêm IAM policy cho Lambda functions xử lý penalty records
# Cần thay thế các giá trị sau:
# - ACCOUNT_ID: 493885330050 (đã có trong error message)
# - REGION: ap-southeast-2
# - TABLE_NAME: penalty_records

ACCOUNT_ID="493885330050"
REGION="ap-southeast-2"
TABLE_NAME="penalty_records"

# Policy cho GET Lambda (chỉ cần đọc)
GET_POLICY='{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:GetItem"
            ],
            "Resource": "arn:aws:dynamodb:'${REGION}':'${ACCOUNT_ID}':table/'${TABLE_NAME}'"
        }
    ]
}'

# Policy cho POST Lambda (cần ghi)
POST_POLICY='{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem"
            ],
            "Resource": "arn:aws:dynamodb:'${REGION}':'${ACCOUNT_ID}':table/'${TABLE_NAME}'"
        }
    ]
}'

# Policy cho DELETE Lambda (cần xóa)
DELETE_POLICY='{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:DeleteItem"
            ],
            "Resource": "arn:aws:dynamodb:'${REGION}':'${ACCOUNT_ID}':table/'${TABLE_NAME}'"
        }
    ]
}'

echo "Lưu ý: Script này chỉ hiển thị policy JSON."
echo "Bạn cần thêm policy này vào IAM role của từng Lambda function thông qua AWS Console hoặc AWS CLI."
echo ""
echo "=== Policy cho GET Lambda ==="
echo "$GET_POLICY"
echo ""
echo "=== Policy cho POST Lambda ==="
echo "$POST_POLICY"
echo ""
echo "=== Policy cho DELETE Lambda ==="
echo "$DELETE_POLICY"

