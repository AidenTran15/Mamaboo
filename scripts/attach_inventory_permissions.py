import boto3
import json

"""
Script tự động attach IAM permissions cho các Lambda functions quản lý inventory.
Chạy: python attach_inventory_permissions.py
"""

LAMBDA_FUNCTIONS = ['inventory-post', 'inventory-get', 'inventory-delete']
REGION = 'ap-southeast-2'
ACCOUNT_ID = '493885330050'  # Account ID của bạn

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
                f"arn:aws:dynamodb:{REGION}:{ACCOUNT_ID}:table/inventory_records",
                f"arn:aws:dynamodb:{REGION}:{ACCOUNT_ID}:table/inventory_records/*"
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
        # ARN format: arn:aws:iam::ACCOUNT:role/service-role/ROLE_NAME
        role_name = role_arn.split('/')[-1]
        
        print(f"Processing {func_name}...")
        print(f"  Role ARN: {role_arn}")
        print(f"  Role Name: {role_name}")
        
        # Attach inline policy
        policy_name = f'InventoryDynamoDBAccess-{func_name}'
        iam.put_role_policy(
            RoleName=role_name,
            PolicyName=policy_name,
            PolicyDocument=json.dumps(INLINE_POLICY)
        )
        
        print(f"  ✅ Attached inline policy '{policy_name}' to role '{role_name}'")
        print()
        
    except lambda_client.exceptions.ResourceNotFoundException:
        print(f"❌ Lambda function '{func_name}' not found. Skipping...")
        print()
    except Exception as e:
        print(f"❌ Error processing {func_name}: {e}")
        print()

print("✅ Done! Wait 1-2 minutes for permissions to propagate, then test Lambda functions.")
print("\nNote: If you still get AccessDeniedException, check:")
print("  1. Lambda function is using the correct role")
print("  2. Table 'inventory_records' exists")
print("  3. Wait a few minutes for permissions to propagate")

