"""로컬 DynamoDB Local → 운영 DynamoDB 로 전체 데이터 복사.

지금까지 로컬에서 수정한 최종 상태(프로젝트·글·콘텐츠)를 운영 테이블로 그대로 옮긴다.
sam deploy 로 운영 테이블이 생성된 뒤 1회 실행.

실행:
  # 운영 AWS 자격증명이 설정된 상태에서 (aws sts get-caller-identity 정상)
  # 로컬 DynamoDB Local 컨테이너가 떠 있어야 함 (localhost:8000)
  cd backend && source .venv/bin/activate
  python scripts/migrate_local_to_prod.py
"""
import os
import boto3

REGION = os.environ.get("AWS_REGION", "ap-northeast-2")
TABLE = os.environ.get("TABLE_NAME", "portfolio-cms")
LOCAL_ENDPOINT = os.environ.get("LOCAL_ENDPOINT", "http://localhost:8000")

# 로컬(소스) — 더미 자격증명
local = boto3.resource(
    "dynamodb",
    region_name=REGION,
    endpoint_url=LOCAL_ENDPOINT,
    aws_access_key_id="dummy",
    aws_secret_access_key="dummy",
).Table(TABLE)

# 운영(대상) — 기본 자격증명 체인 (aws configure / SSO)
prod = boto3.resource("dynamodb", region_name=REGION).Table(TABLE)


def scan_all(table):
    items, kwargs = [], {}
    while True:
        resp = table.scan(**kwargs)
        items.extend(resp.get("Items", []))
        lek = resp.get("LastEvaluatedKey")
        if not lek:
            break
        kwargs["ExclusiveStartKey"] = lek
    return items


def main():
    items = scan_all(local)
    print(f"로컬에서 {len(items)}개 아이템 읽음 → 운영({TABLE}, {REGION})로 복사")
    if not items:
        print("복사할 데이터가 없습니다. (로컬 컨테이너가 떠 있는지 확인)")
        return
    with prod.batch_writer() as bw:
        for it in items:
            bw.put_item(Item=it)
    print(f"✅ {len(items)}개 복사 완료")


if __name__ == "__main__":
    main()
