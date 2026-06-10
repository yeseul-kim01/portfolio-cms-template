#!/usr/bin/env bash
# DynamoDB Local 에 테이블 생성 (로컬 풀스택 테스트용).
# 먼저 DynamoDB Local 을 8000 포트로 띄워두세요:
#   docker run -p 8000:8000 amazon/dynamodb-local
set -e

ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:8000}"
TABLE="${TABLE_NAME:-portfolio-cms}"
REGION="${AWS_REGION:-ap-northeast-2}"

# DynamoDB Local 은 자격증명 검증을 안 하므로 더미값이면 됩니다.
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-dummy}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-dummy}"

aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --table-name "$TABLE" \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --global-secondary-indexes \
    'IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
  2>/dev/null && echo "✅ 테이블 '$TABLE' 생성 완료" \
  || echo "ℹ️  테이블이 이미 있거나 생성 실패 (이미 있으면 무시)"
