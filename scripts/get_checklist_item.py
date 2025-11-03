import argparse
import boto3

"""
Usage:
python scripts/get_checklist_item.py --user "Kim Thu" --date 2025-11-04 --shift sang
"""


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--user', required=True)
    p.add_argument('--date', required=True)
    p.add_argument('--shift', required=True, choices=['sang','trua','toi'])
    return p.parse_args()


def main():
    args = parse_args()
    ddb = boto3.resource('dynamodb', region_name='ap-southeast-2')
    table = ddb.Table('checklist')
    key = {'user': args.user, 'date_shift': f'{args.date}#{args.shift}'}
    res = table.get_item(Key=key)
    item = res.get('Item')
    if not item:
        print('Not found:', key)
    else:
        import json
        print(json.dumps(item, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
