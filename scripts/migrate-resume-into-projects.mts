/**
 * 이력서 큐레이션(이중언어)을 포폴 프로젝트 레코드의 resume:{ko,en} 필드로 병합.
 * 실행: npx tsx scripts/migrate-resume-into-projects.mts http://localhost:8080 test1234
 */
import { RESUME_PROJECTS } from "../src/data/resumeProjects";

const API = process.argv[2] || "http://localhost:8080";
const PW = process.argv[3] || "test1234";

// 포폴 프로젝트 id 와 이력서 id 가 다를 때만 매핑 (보통 비워둠)
const RESUME_ID: Record<string, string> = {};

const login = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: PW }),
});
const { token } = (await login.json()) as { token: string };

const projects = (await (await fetch(`${API}/projects`)).json()) as { id: string }[];

for (const proj of projects) {
  const rid = RESUME_ID[proj.id] ?? proj.id;
  const ko = RESUME_PROJECTS.ko.find((p) => p.id === rid);
  const en = RESUME_PROJECTS.en.find((p) => p.id === rid);
  if (!ko || !en) {
    console.log(`  ${proj.id}: 이력서 데이터 없음(skip)`);
    continue;
  }
  const merged = { ...proj, resume: { ko, en } };
  const r = await fetch(`${API}/projects/${proj.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(merged),
  });
  console.log(`  ${proj.id} ← resume(${rid}) : HTTP ${r.status}`);
}
console.log("done");
