#!/usr/bin/env bash
# 백엔드 + 프론트 한 번에 재배포
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$DIR/deploy-backend.sh"
bash "$DIR/deploy-frontend.sh"
echo "✅ 전체 배포 완료"
