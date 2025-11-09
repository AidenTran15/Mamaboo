import boto3
import json

"""
Script để tạo S3 bucket cho checklist images

Chạy: python create_s3_bucket.py
"""

BUCKET_NAME = 'mamaboo-checklist-images'
REGION = 'ap-southeast-2'

s3_client = boto3.client('s3', region_name=REGION)

# Try to create bucket (may already exist)
try:
    if REGION == 'us-east-1':
        # us-east-1 doesn't need LocationConstraint
        s3_client.create_bucket(Bucket=BUCKET_NAME)
        print(f"✅ Bucket '{BUCKET_NAME}' đã được tạo thành công!")
    else:
        s3_client.create_bucket(
            Bucket=BUCKET_NAME,
            CreateBucketConfiguration={'LocationConstraint': REGION}
        )
        print(f"✅ Bucket '{BUCKET_NAME}' đã được tạo thành công!")
except s3_client.exceptions.BucketAlreadyExists:
    print(f"Bucket '{BUCKET_NAME}' đã tồn tại.")
except s3_client.exceptions.BucketAlreadyOwnedByYou:
    print(f"Bucket '{BUCKET_NAME}' đã được bạn sở hữu.")
except Exception as e:
    print(f"⚠ Lỗi khi tạo bucket: {e}")
    # Continue anyway - bucket might already exist

# Disable Block Public Access settings to allow public read (run regardless of bucket creation)
print("\nĐang cấu hình Block Public Access...")
try:
    s3_client.put_public_access_block(
        Bucket=BUCKET_NAME,
        PublicAccessBlockConfiguration={
            'BlockPublicAcls': True,  # Block ACLs (we use bucket policy instead)
            'IgnorePublicAcls': True,  # Ignore ACLs
            'BlockPublicPolicy': False,  # Allow bucket policy (for public read)
            'RestrictPublicBuckets': False  # Allow public access via bucket policy
        }
    )
    print(f"✅ Đã cấu hình Block Public Access cho bucket '{BUCKET_NAME}'")
    print("   (ACLs bị block, sử dụng bucket policy cho public access)")
except Exception as e:
    print(f"⚠ Cảnh báo: Không thể cấu hình Block Public Access: {e}")
    print("   Vui lòng cấu hình thủ công trong AWS Console:")
    print("   S3 → mamaboo-checklist-images → Permissions → Block public access → Edit")
    print("   - Block public ACLs: ✅ (checked)")
    print("   - Ignore public ACLs: ✅ (checked)")
    print("   - Block public bucket policies: ❌ (unchecked)")
    print("   - Restrict public bucket policies: ❌ (unchecked)")

# Enable public read access for images (run regardless of bucket creation)
print("\nĐang cấu hình Bucket Policy...")
try:
    bucket_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{BUCKET_NAME}/*"
            }
        ]
    }
    
    s3_client.put_bucket_policy(
        Bucket=BUCKET_NAME,
        Policy=json.dumps(bucket_policy)
    )
    
    print(f"✅ Đã cấu hình public read access cho bucket '{BUCKET_NAME}'")
except Exception as e:
    print(f"⚠ Cảnh báo: Không thể set bucket policy: {e}")
    print("   Vui lòng cấu hình bucket policy thủ công trong AWS Console:")
    print("   S3 → mamaboo-checklist-images → Permissions → Bucket policy → Edit → Paste policy")
    print("   Hoặc sử dụng presigned URLs thay vì public URLs")

print(f"\n✅ Hoàn tất cấu hình bucket '{BUCKET_NAME}'!")

