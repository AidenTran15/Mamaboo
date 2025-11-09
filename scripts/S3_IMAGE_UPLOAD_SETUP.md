# Hướng dẫn Setup S3 Image Upload cho Checklist

## Vấn đề
DynamoDB có giới hạn 400KB cho mỗi item. Khi checklist có nhiều ảnh base64, tổng kích thước có thể vượt quá giới hạn này.

## Giải pháp
Upload ảnh lên S3 và chỉ lưu URL vào DynamoDB. URL chỉ chiếm vài trăm bytes thay vì hàng trăm KB.

## Các bước setup

### 1. Tạo S3 Bucket

```bash
python scripts/create_s3_bucket.py
```

Hoặc tạo thủ công:
- Vào AWS Console → S3
- Create bucket
- Tên: `mamaboo-checklist-images`
- Region: `ap-southeast-2`
- Uncheck "Block all public access" (hoặc cấu hình bucket policy cho public read)

### 2. Cấu hình Bucket Policy (cho public read)

Bucket policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mamaboo-checklist-images/*"
    }
  ]
}
```

### 3. Deploy Lambda Function

```bash
cd scripts
zip lambda_image_upload.zip lambda_image_upload.py

aws lambda create-function \
  --function-name image-upload \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-s3-role \
  --handler lambda_image_upload.lambda_handler \
  --zip-file fileb://lambda_image_upload.zip \
  --region ap-southeast-2 \
  --environment Variables="{S3_BUCKET_NAME=mamaboo-checklist-images,AWS_REGION=ap-southeast-2}"
```

### 4. Cấu hình IAM Permissions cho Lambda

Lambda function cần quyền:
- `s3:PutObject` trên bucket `mamaboo-checklist-images`
- `s3:PutObjectAcl` để set public-read

Policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::mamaboo-checklist-images/*"
    }
  ]
}
```

### 5. Tạo API Gateway Endpoint

- Method: POST
- Integration: Lambda Function (`image-upload`)
- Enable CORS

### 6. Cập nhật Frontend

Cập nhật `IMAGE_UPLOAD_API` trong `mamaboo-app/src/constants/api.js` với API Gateway URL.

## Cách hoạt động

1. User upload ảnh → Frontend nén ảnh và lưu base64 vào state
2. Khi "Kết ca":
   - Frontend gọi `IMAGE_UPLOAD_API` để upload tất cả ảnh lên S3
   - Lambda upload ảnh lên S3 và trả về public URLs
   - Frontend dùng S3 URLs thay vì base64 khi lưu checklist
   - DynamoDB chỉ lưu URLs (vài trăm bytes) thay vì base64 (hàng trăm KB)

## Lợi ích

- ✅ Không bị giới hạn 400KB của DynamoDB
- ✅ Tất cả ảnh đều được lưu (không bị loại bỏ)
- ✅ Ảnh được lưu riêng, dễ quản lý
- ✅ Có thể xem ảnh trực tiếp từ URL

