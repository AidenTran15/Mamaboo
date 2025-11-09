import boto3
import json

"""
Script kiểm tra và verify Lambda functions đang dùng đúng IAM role với permissions.
Chạy: python verify_lambda_role.py
"""

LAMBDA_FUNCTIONS = ['inventory-post', 'inventory-get', 'inventory-delete']
REGION = 'ap-southeast-2'
TABLE_NAME = 'inventory_records'
ACCOUNT_ID = '493885330050'

lambda_client = boto3.client('lambda', region_name=REGION)
iam = boto3.client('iam')

print("=" * 60)
print("Verifying Lambda Functions and IAM Roles")
print("=" * 60)
print()

for func_name in LAMBDA_FUNCTIONS:
    try:
        # Get Lambda function configuration
        func_config = lambda_client.get_function_configuration(FunctionName=func_name)
        role_arn = func_config['Role']
        role_name = role_arn.split('/')[-1]
        
        print(f"📦 Lambda Function: {func_name}")
        print(f"   Role ARN: {role_arn}")
        print(f"   Role Name: {role_name}")
        
        # Get role policies
        try:
            # List attached managed policies
            attached_policies = iam.list_attached_role_policies(RoleName=role_name)
            print(f"   Attached Managed Policies: {len(attached_policies.get('AttachedPolicies', []))}")
            for policy in attached_policies.get('AttachedPolicies', []):
                print(f"      - {policy['PolicyName']} ({policy['PolicyArn']})")
            
            # List inline policies
            inline_policies = iam.list_role_policies(RoleName=role_name)
            inline_policy_names = inline_policies.get('PolicyNames', [])
            print(f"   Inline Policies: {len(inline_policy_names)}")
            for policy_name in inline_policy_names:
                policy_doc = iam.get_role_policy(RoleName=role_name, PolicyName=policy_name)
                print(f"      - {policy_name}")
                # Check if policy has DynamoDB permissions
                policy_document = json.loads(policy_doc['PolicyDocument'])
                has_dynamodb = False
                for statement in policy_document.get('Statement', []):
                    actions = statement.get('Action', [])
                    if isinstance(actions, str):
                        actions = [actions]
                    for action in actions:
                        if 'dynamodb' in action.lower():
                            has_dynamodb = True
                            break
                    if has_dynamodb:
                        break
                if has_dynamodb:
                    print(f"         ✅ Has DynamoDB permissions")
                else:
                    print(f"         ⚠️  No DynamoDB permissions found")
            
            # Check if role has DynamoDB permissions through any policy
            # Simulate policy evaluation
            print(f"   Checking permissions for table '{TABLE_NAME}'...")
            
            # Try to determine if role has access
            # This is a simplified check - actual permissions depend on policy evaluation
            has_access = False
            if attached_policies.get('AttachedPolicies'):
                for policy in attached_policies['AttachedPolicies']:
                    policy_name = policy['PolicyName']
                    if 'DynamoDB' in policy_name or 'Administrator' in policy_name:
                        has_access = True
                        print(f"      ✅ Found DynamoDB-related policy: {policy_name}")
                        break
            
            if inline_policy_names:
                for policy_name in inline_policy_names:
                    policy_doc = iam.get_role_policy(RoleName=role_name, PolicyName=policy_name)
                    policy_document = json.loads(policy_doc['PolicyDocument'])
                    for statement in policy_document.get('Statement', []):
                        actions = statement.get('Action', [])
                        if isinstance(actions, str):
                            actions = [actions]
                        for action in actions:
                            if 'dynamodb' in action.lower():
                                resources = statement.get('Resource', [])
                                if isinstance(resources, str):
                                    resources = [resources]
                                for resource in resources:
                                    if TABLE_NAME in resource or '*' in resource:
                                        has_access = True
                                        print(f"      ✅ Found DynamoDB permission in inline policy: {policy_name}")
                                        break
            
            if not has_access:
                print(f"      ⚠️  WARNING: No DynamoDB permissions found for table '{TABLE_NAME}'")
                print(f"      💡 Suggestion: Run 'python attach_inventory_permissions.py' to add permissions")
            
        except Exception as e:
            print(f"   ❌ Error checking policies: {e}")
        
        print()
        
    except lambda_client.exceptions.ResourceNotFoundException:
        print(f"❌ Lambda function '{func_name}' not found")
        print()
    except Exception as e:
        print(f"❌ Error processing {func_name}: {e}")
        print()

print("=" * 60)
print("Verification Complete")
print("=" * 60)
print()
print("If permissions are missing, run:")
print("  python attach_inventory_permissions.py")
print()
print("Note: After adding permissions, wait 1-2 minutes for them to propagate.")

