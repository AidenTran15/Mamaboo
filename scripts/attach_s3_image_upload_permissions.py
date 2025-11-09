import boto3
import json

"""
Script để attach IAM permissions cho Lambda function image-upload
Lambda function này cần quyền upload ảnh lên S3 bucket mamaboo-checklist-images
"""

LAMBDA_FUNCTION_NAME = 'image-upload'
S3_BUCKET_NAME = 'mamaboo-checklist-images'
REGION = 'ap-southeast-2'

iam = boto3.client('iam', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)

def get_lambda_role_name(function_name):
    """Lấy tên IAM role của Lambda function"""
    try:
        response = lambda_client.get_function(FunctionName=function_name)
        role_arn = response['Configuration']['Role']
        role_name = role_arn.split('/')[-1]
        return role_name
    except Exception as e:
        print(f"❌ Lỗi khi lấy role của Lambda function: {e}")
        return None

def attach_s3_policy(role_name):
    """Attach policy cho phép upload lên S3"""
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                "Resource": f"arn:aws:s3:::{S3_BUCKET_NAME}/*"
            }
        ]
    }
    
    policy_name = f"{LAMBDA_FUNCTION_NAME}-s3-upload-policy"
    
    try:
        # Tạo policy
        policy_arn = iam.create_policy(
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_document),
            Description=f"Allow {LAMBDA_FUNCTION_NAME} to upload images to S3"
        )['Policy']['Arn']
        print(f"✅ Đã tạo policy: {policy_name}")
    except iam.exceptions.EntityAlreadyExistsException:
        # Policy đã tồn tại, lấy ARN
        account_id = boto3.client('sts').get_caller_identity()['Account']
        policy_arn = f"arn:aws:iam::{account_id}:policy/{policy_name}"
        print(f"ℹ️  Policy đã tồn tại: {policy_name}")
    except Exception as e:
        print(f"❌ Lỗi khi tạo policy: {e}")
        return False
    
    try:
        # Attach policy vào role
        iam.attach_role_policy(
            RoleName=role_name,
            PolicyArn=policy_arn
        )
        print(f"✅ Đã attach policy vào role: {role_name}")
        return True
    except iam.exceptions.EntityAlreadyExistsException:
        print(f"ℹ️  Policy đã được attach vào role: {role_name}")
        return True
    except Exception as e:
        print(f"❌ Lỗi khi attach policy: {e}")
        return False

def main():
    print(f"🔧 Đang cấu hình IAM permissions cho Lambda function: {LAMBDA_FUNCTION_NAME}")
    print(f"   S3 Bucket: {S3_BUCKET_NAME}\n")
    
    # Lấy role name của Lambda function
    role_name = get_lambda_role_name(LAMBDA_FUNCTION_NAME)
    if not role_name:
        print("\n❌ Không thể lấy role name. Vui lòng kiểm tra:")
        print(f"   1. Lambda function '{LAMBDA_FUNCTION_NAME}' đã được tạo chưa?")
        print(f"   2. Lambda function có IAM role chưa?")
        return
    
    print(f"📋 Lambda function role: {role_name}\n")
    
    # Attach S3 policy
    if attach_s3_policy(role_name):
        print(f"\n✅ Hoàn tất! Lambda function '{LAMBDA_FUNCTION_NAME}' đã có quyền upload lên S3.")
    else:
        print(f"\n❌ Có lỗi xảy ra. Vui lòng kiểm tra và thử lại.")

if __name__ == '__main__':
    main()

