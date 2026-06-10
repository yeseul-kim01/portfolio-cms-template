#!/usr/bin/env bash
# 백엔드 배포: SAM build + deploy. 설정/비번은 backend/samconfig.toml (samconfig.toml.example 참고).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$ROOT/deploy.env" ] && { set -a; source "$ROOT/deploy.env"; set +a; }   # (선택) AWS_PROFILE
export AWS_PROFILE="${AWS_PROFILE:-default}"

cd "$ROOT/backend"
[ -f samconfig.toml ] || { echo "❌ samconfig.toml 없음 — 'cp samconfig.toml.example samconfig.toml' 후 값 채우세요"; exit 1; }

echo "▶ sam build"
sam build

echo "▶ sam deploy"
sam deploy

echo "✅ 백엔드 배포 완료. Outputs 의 ApiUrl 을 deploy.env 의 API_URL 에 넣으세요."
