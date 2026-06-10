/**
 * 이력서 번들(정적 데이터)을 content "resume" 문서로 DB 에 seed.
 *
 * 실행:
 *   로컬:  npx tsx scripts/seed-resume.mts http://localhost:8080 test1234
 *   운영:  npx tsx scripts/seed-resume.mts https://<api> <ADMIN_PASSWORD>
 */
import { RESUME_BUNDLE_STATIC } from "../src/data/resumeBundle";

const API = process.argv[2] || process.env.API_BASE || "http://localhost:8080";
const PW = process.argv[3] || process.env.ADMIN_PASSWORD || "test1234";

const login = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: PW }),
});
if (!login.ok) {
  console.error("로그인 실패", login.status);
  process.exit(1);
}
const { token } = (await login.json()) as { token: string };

const put = await fetch(`${API}/content/resume`, {
  method: "PUT",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify(RESUME_BUNDLE_STATIC),
});
console.log(`seed resume → ${API}: HTTP ${put.status}`);
process.exit(put.ok ? 0 : 1);
