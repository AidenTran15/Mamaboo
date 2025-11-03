import argparse
import json
import boto3
from datetime import datetime, timezone

"""
Usage examples:

python scripts/save_checklist_item.py \
  --user "Kim Thu" \
  --date 2025-11-04 \
  --shift sang \
  --tasks '{"bar": {"done": true, "imageUrl": "https://s3/.../bar.jpg"}, "wc": {"done": false, "imageUrl": ""}}'

Notes:
- It's recommended to store images in S3 and pass the public/protected URL in imageUrl.
- Region is fixed to ap-southeast-2 for your environment.
"""


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--user', required=True)
    p.add_argument('--date', required=True, help='YYYY-MM-DD')
    p.add_argument('--shift', required=True, choices=['sang','trua','toi'])
    p.add_argument('--tasks', default='{}', help='JSON string of task map')
    return p.parse_args()


def main():
    args = parse_args()
    try:
        tasks = json.loads(args.tasks)
    except Exception as e:
        raise SystemExit(f'Invalid tasks JSON: {e}')

    item = {
        'user': args.user,
        'date_shift': f"{args.date}#{args.shift}",
        'date': args.date,
        'shift': args.shift,
        'tasks': tasks,
        'updatedAt': datetime.now(timezone.utc).isoformat()
    }
    # set createdAt only when first created
    item['createdAt'] = item['updatedAt']

    dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-2')
    table = dynamodb.Table('checklist')

    table.put_item(Item=item)
    print('Saved checklist:', json.dumps(item, ensure_ascii=False))


if __name__ == '__main__':
    main()
