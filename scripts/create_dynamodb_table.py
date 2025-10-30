import boto3

# AWS credentials should be configured in your environment or through AWS CLI
# Table name
TABLE_NAME = 'nhan_vien'

# Specify the AWS region (Sydney)
REGION_NAME = 'ap-southeast-2'

# Define the DynamoDB client with Sydney region
client = boto3.client('dynamodb', region_name=REGION_NAME)

def create_table():
    try:
        response = client.create_table(
            TableName=TABLE_NAME,
            KeySchema=[
                {
                    'AttributeName': 'số điện thoại',
                    'KeyType': 'HASH'  # Partition key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'số điện thoại',
                    'AttributeType': 'S'  # String
                },
            ],
            BillingMode='PAY_PER_REQUEST',  # On-demand mode
        )
        print(f'Table {TABLE_NAME} is being created. Status: {response["TableDescription"]["TableStatus"]}')
    except client.exceptions.ResourceInUseException:
        print(f'Table {TABLE_NAME} already exists.')
    except Exception as e:
        print(f'Error creating table: {e}')

def main():
    create_table()

if __name__ == '__main__':
    main()
