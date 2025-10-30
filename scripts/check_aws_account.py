import boto3

def get_account_id():
    sts = boto3.client('sts')
    identity = sts.get_caller_identity()
    print(f"AWS Account ID: {identity['Account']}")
    print(f"User ARN: {identity['Arn']}")
    print(f"User ID: {identity['UserId']}")

if __name__ == '__main__':
    get_account_id()
