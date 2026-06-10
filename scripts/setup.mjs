#!/usr/bin/env node
// 대화형 셋업 마법사: 질문 → config 파일 생성(.env / deploy.env / backend/samconfig.toml) → (선택) 배포.
// 의존성 없이 Node 내장 모듈만 사용.
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rl = createInterface({ input: stdin, output: stdout });

const C = { dim: "\x1b[2m", b: "\x1b[1m", g: "\x1b[32m", y: "\x1b[33m", r: "\x1b[0m", c: "\x1b[36m" };
const log = (s = "") => console.log(s);

async function ask(label, def = "", { required = false, secret = false } = {}) {
  const hint = def ? ` ${C.dim}(${def})${C.r}` : required ? ` ${C.y}(필수)${C.r}` : "";
  while (true) {
    const a = (await rl.question(`${C.c}?${C.r} ${label}${hint}: `)).trim();
    const v = a || def;
    if (!v && required) {
      log(`  ${C.y}값이 필요해요.${C.r}`);
      continue;
    }
    if (secret && v && v.length < 8) {
      log(`  ${C.y}8자 이상으로 강하게 설정하세요.${C.r}`);
      continue;
    }
    return v;
  }
}
async function confirm(label, def = false) {
  const a = (await rl.question(`${C.c}?${C.r} ${label} ${C.dim}(${def ? "Y/n" : "y/N"})${C.r}: `)).trim().toLowerCase();
  if (!a) return def;
  return a === "y" || a === "yes";
}

log(`\n${C.b}🚀 Portfolio CMS 셋업 마법사${C.r}`);
log(`${C.dim}질문에 답하면 config 파일을 만들어 줍니다. Enter = 기본값.${C.r}\n`);

if (existsSync(join(ROOT, "deploy.env"))) {
  const ok = await confirm("이미 deploy.env 가 있어요. 덮어쓸까요?", false);
  if (!ok) {
    log("취소했어요.");
    rl.close();
    process.exit(0);
  }
}

// ---- 신원 ----
log(`${C.b}1) 신원 · 소셜${C.r}`);
const name = await ask("이름", "Your Name");
const brand = await ask("상단 로고 텍스트(이니셜 등)", "PF");
const email = await ask("이메일", "you@example.com");
const domain = await ask("도메인", "yourdomain.com");
const github = await ask("GitHub URL", "https://github.com/your-id");
const blog = await ask("블로그 URL", "https://yourblog.tistory.com");
const hf = await ask("HuggingFace URL(없으면 Enter)", "");

// ---- AWS / 배포 ----
log(`\n${C.b}2) AWS · 배포${C.r}`);
const profile = await ask("AWS 프로필", "default");
const region = await ask("AWS 리전", "ap-northeast-2");
const project = await ask("프로젝트 이름(리소스 접두사)", "portfolio-cms");
const adminPw = await ask("관리자 비밀번호(글쓰기 로그인)", "", { required: true, secret: true });

// ---- 파일 생성 ----
const siteEnv = [
  ["VITE_SITE_NAME", name],
  ["VITE_SITE_BRAND", brand],
  ["VITE_SITE_EMAIL", email],
  ["VITE_SITE_DOMAIN", domain],
  ["VITE_GITHUB_URL", github],
  ["VITE_BLOG_URL", blog],
  ["VITE_HF_URL", hf],
];

// .env (로컬 개발용 — 기본 localhost, 신원은 박아둠)
writeFileSync(
  join(ROOT, ".env"),
  ["VITE_API_BASE_URL=http://localhost:8080", ...siteEnv.map(([k, v]) => `${k}=${v}`)].join("\n") + "\n",
);

// deploy.env (배포용 — API_URL/BUCKET/DIST_ID 는 백엔드 배포 후 채워짐)
writeFileSync(
  join(ROOT, "deploy.env"),
  [
    `AWS_PROFILE=${profile}`,
    `REGION=${region}`,
    `STACK_NAME=${project}`,
    "",
    "# 비워두면 백엔드 스택 Outputs 에서 자동으로 읽어옵니다",
    "API_URL=",
    "BUCKET=",
    "DIST_ID=",
    "",
    `SITE_NAME=${name}`,
    `SITE_BRAND=${brand}`,
    `SITE_EMAIL=${email}`,
    `SITE_DOMAIN=${domain}`,
    `GITHUB_URL=${github}`,
    `BLOG_URL=${blog}`,
    `HF_URL=${hf}`,
    "HERO_IMAGE=",
    "FAVICON=",
  ].join("\n") + "\n",
);

// backend/samconfig.toml
const frontendOrigin = domain && domain !== "yourdomain.com" ? `https://${domain}` : "http://localhost:5173";
writeFileSync(
  join(ROOT, "backend", "samconfig.toml"),
  [
    "version = 0.1",
    "",
    "[default.deploy.parameters]",
    `stack_name = "${project}"`,
    `region = "${region}"`,
    'capabilities = "CAPABILITY_IAM"',
    "resolve_s3 = true",
    "confirm_changeset = false",
    `parameter_overrides = "AdminPassword=\\"${adminPw}\\" ProjectName=\\"${project}\\" FrontendOrigin=\\"${frontendOrigin}\\""`,
  ].join("\n") + "\n",
);

log(`\n${C.g}✓ 생성됨:${C.r} .env · deploy.env · backend/samconfig.toml`);
log(`${C.dim}  (셋 다 .gitignore 되어 있어 커밋되지 않아요)${C.r}`);

// ---- 배포 ----
log(`\n${C.b}3) 배포${C.r}`);
const deployNow = await confirm("지금 백엔드를 배포할까요? (AWS CLI·SAM·Docker 필요)", false);
rl.close();

if (!deployNow) {
  log(`\n다음에 배포하려면 (백엔드 스택이 프론트 호스팅까지 만들어요):`);
  log(`  ${C.c}npm run deploy${C.r}   ${C.dim}# 백엔드(sam) + 프론트(빌드·업로드) 한 번에${C.r}`);
  log(`\n로컬 미리보기: ${C.c}npm run dev${C.r}\n`);
  process.exit(0);
}

try {
  log(`\n${C.dim}▶ 백엔드 배포 (sam build && deploy) — 첫 배포는 CloudFront 생성에 몇 분 걸려요…${C.r}`);
  execSync("bash scripts/deploy-backend.sh", { cwd: ROOT, stdio: "inherit", env: { ...process.env, AWS_PROFILE: profile } });

  // 스택 Outputs 읽어서 deploy.env 에 반영
  const out = execSync(
    `aws cloudformation describe-stacks --stack-name ${project} --region ${region} --query "Stacks[0].Outputs" --output json`,
    { cwd: ROOT, env: { ...process.env, AWS_PROFILE: profile } },
  ).toString();
  const outputs = JSON.parse(out);
  const pick = (k) => outputs.find((o) => o.OutputKey === k)?.OutputValue || "";
  const apiUrl = pick("ApiUrl");
  const bucket = pick("WebsiteBucketName");
  const dist = pick("DistributionId");
  const siteUrl = pick("SiteUrl");

  let de = readFileSync(join(ROOT, "deploy.env"), "utf8");
  de = de
    .replace(/^API_URL=.*$/m, `API_URL=${apiUrl}`)
    .replace(/^BUCKET=.*$/m, `BUCKET=${bucket}`)
    .replace(/^DIST_ID=.*$/m, `DIST_ID=${dist}`);
  writeFileSync(join(ROOT, "deploy.env"), de);
  log(`\n${C.g}✓ 백엔드 완료${C.r} — API: ${apiUrl}`);

  log(`\n${C.dim}▶ 프론트 빌드 → S3 업로드 → CloudFront 무효화…${C.r}`);
  execSync("bash scripts/deploy-frontend.sh", { cwd: ROOT, stdio: "inherit", env: { ...process.env, AWS_PROFILE: profile } });

  log(`\n${C.g}${C.b}🎉 배포 완료!${C.r}`);
  log(`   사이트: ${C.c}${siteUrl}${C.r}  ${C.dim}(CloudFront 전파 후 수 분 내 접속)${C.r}`);
  log(`   관리자: ${C.c}${siteUrl}/admin${C.r}  (방금 정한 비밀번호로 로그인)\n`);
} catch (e) {
  log(`\n${C.y}배포 중 중단됨:${C.r} ${e.message}`);
  log(`config 는 생성됐으니, 도구 설치 후 ${C.c}npm run deploy${C.r} 로 다시 시도하세요.\n`);
  process.exit(1);
}
