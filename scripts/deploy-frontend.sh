#!/usr/bin/env bash
# 프론트 배포: 운영 API/신원으로 빌드 → S3 업로드 → CloudFront 무효화.
# 설정값은 deploy.env (deploy.env.example 복사해서 채우세요).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ -f deploy.env ] || { echo "❌ deploy.env 없음 — 'cp deploy.env.example deploy.env' 후 값 채우세요"; exit 1; }
set -a; source deploy.env; set +a
export AWS_PROFILE="${AWS_PROFILE:-default}"
REGION="${REGION:-ap-northeast-2}"

# API_URL / BUCKET / DIST_ID 가 비어 있으면 CloudFormation 스택 Outputs 에서 자동으로 읽음
if [ -z "${API_URL:-}" ] || [ -z "${BUCKET:-}" ] || [ -z "${DIST_ID:-}" ]; then
  STACK="${STACK_NAME:-portfolio-cms}"
  echo "▶ 스택 '$STACK' Outputs 에서 값 읽는 중…"
  get() { aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text 2>/dev/null; }
  API_URL="${API_URL:-$(get ApiUrl)}"
  BUCKET="${BUCKET:-$(get WebsiteBucketName)}"
  DIST_ID="${DIST_ID:-$(get DistributionId)}"
fi
[ -n "$API_URL" ] && [ -n "$BUCKET" ] && [ -n "$DIST_ID" ] || {
  echo "❌ API_URL/BUCKET/DIST_ID 를 못 찾았어요. 백엔드를 먼저 배포하거나 deploy.env 에 채우세요."; exit 1; }

# 빌드 시 주입되는 값 (Vite 는 VITE_* 환경변수를 번들에 포함)
export VITE_API_BASE_URL="$API_URL"
export VITE_SITE_NAME="${SITE_NAME:-}"
export VITE_SITE_BRAND="${SITE_BRAND:-}"
export VITE_SITE_EMAIL="${SITE_EMAIL:-}"
export VITE_SITE_DOMAIN="${SITE_DOMAIN:-}"
export VITE_BLOG_URL="${BLOG_URL:-}"
export VITE_GITHUB_URL="${GITHUB_URL:-}"
export VITE_HF_URL="${HF_URL:-}"
export VITE_HERO_IMAGE="${HERO_IMAGE:-}"
export VITE_FAVICON="${FAVICON:-}"

echo "▶ 빌드"
npm run build

echo "▶ S3 업로드 (s3://$BUCKET)"
aws s3 sync dist/ "s3://$BUCKET" --delete

echo "▶ CloudFront 무효화 ($DIST_ID)"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" --query "Invalidation.Id" --output text

echo "✅ 프론트 배포 완료 (전파 몇 분)"
