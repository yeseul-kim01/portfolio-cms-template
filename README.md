# Portfolio + Blog + Resume — Serverless CMS Template

개인 **포트폴리오 · 기술 블로그 · 이력서**를 한 곳에서 운영하는 풀스택 템플릿.
모든 내용은 관리자 페이지(`/admin`)에서 **DB로 편집**하고, AWS 서버리스로 배포해 **idle 시 비용 ~$0**.

- **Frontend** — React + Vite + TypeScript + Tailwind (S3 + CloudFront)
- **Backend** — FastAPI on Lambda + DynamoDB(단일 테이블) + S3(이미지), AWS SAM
- **Auth** — 단일 비밀번호 로그인 (JWT, 비번에서 서명키 파생)
- 다국어(KO/EN) · 라이트/다크 **색 테마**(관리자) · **자유 섹션**(노션식 추가/순서) · **핵심 역량 카드** · 블로그 글 가져오기 · 조회수 대시보드

---

## 🚀 빠른 시작 (대화형 마법사)

```bash
# 1) 이 저장소를 "Use this template" 로 복제 → 클론 후
npm install

# 2) 마법사: 이름·소셜·AWS 설정·비번을 묻고 config 파일을 만들어 줍니다
npm run setup
#    → .env / deploy.env / backend/samconfig.toml 자동 생성
#    → 끝에서 "지금 배포할까요?" 선택 시 백엔드+프론트까지 한 번에 배포

# 끝나면 라이브 URL이 출력됩니다.
```

준비물: **Node 18+**, **AWS CLI**, **AWS SAM CLI**, **Docker**(sam build 용).

> 마법사 없이 손으로 하려면 아래 [수동 배포](#수동-배포) 참고.

---

## AWS 가 처음이라면 (IAM · CLI 설정)

1. **AWS 계정** 생성 (카드 등록 필요하지만, 개인 포트폴리오 트래픽이면 거의 청구 안 됨 — 아래 [비용](#비용) 참고).
2. **IAM 사용자** 만들기 (루트 계정은 직접 쓰지 마세요):
   - 콘솔 → **IAM → 사용자 → 사용자 생성**
   - 권한: 가장 쉬운 건 **`AdministratorAccess`** 정책 연결 (개인 프로젝트면 충분, 나중에 좁혀도 됨)
   - 만든 사용자 → **보안 자격 증명 → 액세스 키 생성**(CLI 용) → Access Key / Secret 복사
3. **AWS CLI 설정**:
   ```bash
   aws configure --profile myportfolio
   #   AWS Access Key ID     : (복사한 키)
   #   AWS Secret Access Key : (복사한 시크릿)
   #   Default region        : ap-northeast-2
   ```
   → `npm run setup` 에서 **AWS 프로필**을 `myportfolio` 로 입력하면 끝.
4. **SAM CLI** + **Docker** 설치 (`sam build` 가 컨테이너로 빌드).

> 최소 권한으로 좁히려면: CloudFormation · Lambda · DynamoDB · S3 · CloudFront · API Gateway · IAM(역할 생성) · CloudWatch Logs 권한이면 됩니다.

---

## 로컬에서 먼저 보기

```bash
npm install
cp .env.example .env     # 기본 localhost:8080
npm run dev              # http://localhost:5173
```
`.env` 의 `VITE_API_BASE_URL` 을 비우면 **백엔드 없이** 정적 샘플로 UI만 미리볼 수 있어요.

풀스택 로컬(관리자/DB까지):
```bash
docker run -p 8000:8000 amazon/dynamodb-local
cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
DYNAMODB_ENDPOINT=http://localhost:8000 bash scripts/create-local-table.sh
ADMIN_PASSWORD=test1234 python -m uvicorn app.main:app --reload --port 8080
```

---

## 내 것으로 만들기

| 무엇 | 어디서 |
|---|---|
| 이름·브랜드·이메일·도메인·소셜·favicon·중앙이미지 | `npm run setup` 또는 `src/config/site.ts` / `.env` (`VITE_SITE_*`) |
| 사이트 텍스트(소개·**스킬·자유 섹션**·학력·자격·경력) | `/admin → 사이트 내용` |
| **핵심 역량 카드**(라벨·레벨·색·태그) · 역량 설명/근거 · 블로그 글 | `/admin → 이력서 편집` |
| 프로젝트(+이력서 필드) · 글 · **색 테마** | `/admin` 각 탭 |

콘텐츠는 전부 DB라 코드 수정 없이 바꿔요. 첫 화면은 중립 샘플로 채워져 있습니다.

---

## 수동 배포

백엔드 스택이 **프론트 호스팅(S3 + CloudFront)까지 한 번에** 만들어요. 버킷/배포를 미리 만들 필요 없음.

```bash
# 1) 백엔드 + 인프라 (DynamoDB·Lambda·S3·CloudFront)
cd backend
cp samconfig.toml.example samconfig.toml   # AdminPassword / ProjectName / FrontendOrigin(선택)
cd .. && bash scripts/deploy-backend.sh

# 2) 프론트 빌드·업로드 (BUCKET/DIST_ID/API_URL 은 스택 Outputs 에서 자동)
cp deploy.env.example deploy.env           # SITE_* 신원값만 채우면 됨
bash scripts/deploy-frontend.sh            # 끝나면 CloudFront URL 로 접속
```
한 번에: `npm run deploy` (= `deploy-all.sh`). 배포된 주소는 스택 Outputs 의 **SiteUrl**.

> 커스텀 도메인(예: yourdomain.com)은 CloudFront 에 ACM 인증서(us-east-1)+Route53 로 따로 연결하면 돼요(선택).

---

## 비용

개인 포트폴리오(저트래픽) 기준 **사실상 무료 ~ 월 $1 미만**. 거의 다 프리티어 + 사용량 과금이라 idle 시 0에 수렴해요.

| 서비스 | 과금 | 개인 사이트 |
|---|---|---|
| Lambda | 월 100만 요청 + 40만 GB-초 무료 | ~$0 |
| DynamoDB | on-demand(쓴 만큼) + 25GB 무료 | ~$0 |
| S3 | 저장·요청 (수 MB) | ~$0 |
| CloudFront | 데이터 전송·요청 (프리티어 1TB/월) | ~$0 |
| CloudWatch Logs | 소량 | 몇 센트 |

- **커스텀 도메인**을 쓸 때만 추가: Route53 호스팅 영역 **$0.50/월** + 도메인 등록 **~$12/년**(.com). ACM 인증서는 무료.
- 트래픽이 크게 늘어도 서버리스라 쓴 만큼만 늘어요. 걱정되면 AWS **Billing 알림(Budgets)** 을 $5 정도로 걸어두세요.

---

## 관리자 (`/admin`)
AdminPassword 로 로그인 → **글 · 프로젝트 · 사이트 내용 · 이력서 편집 · 색 테마**.
조회수 대시보드(이력서/프로젝트/역량 열람)도 포함.

## 보안
- `.env` · `deploy.env` · `backend/samconfig.toml` 은 `.gitignore` — **비번·키 커밋 금지**
- 관리자 비번에서 JWT 서명키가 파생되니 **강한 비번** 사용

## 라이선스 · 출처 (Credits)
**MIT © [seul0-0](https://github.com/yeseul-kim01)** 가 만든 템플릿입니다.

자유롭게 쓰고 수정·배포할 수 있지만, MIT 조건에 따라 **`LICENSE` 파일(저작권·출처 표기)을 그대로 유지**해 주세요.
이 템플릿으로 사이트를 만들었다면 출처(원작자 **seul0-0**)를 한 줄 남겨주면 감사하겠습니다. ⭐
