/**
 * 기존 정적 프로젝트 데이터(src/data/content.ko.ts)를 DynamoDB 로 한 번 이전.
 *
 * 실행: AWS 자격증명이 설정된 상태에서
 *   AWS_REGION=ap-northeast-2 TABLE_NAME=portfolio-cms npx tsx scripts/seed.mts
 *
 * db.py 의 put_project 와 동일한 키 구조로 저장합니다.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { contentKo } from "../src/data/content.ko";
import { contentEn } from "../src/data/content.en";
import type { Project } from "../src/types/project";

const REGION = process.env.AWS_REGION ?? "ap-northeast-2";
const TABLE = process.env.TABLE_NAME ?? "portfolio-cms";
// 로컬(DynamoDB Local)일 때 http://localhost:8000 지정. 비우면 실제 AWS.
const ENDPOINT = process.env.DYNAMODB_ENDPOINT || undefined;

const doc = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION, endpoint: ENDPOINT }),
  { marshallOptions: { removeUndefinedValues: true } },
);

function projectItem(p: Project, index: number) {
  const order = String((p as { order?: number }).order ?? (index + 1) * 10).padStart(4, "0");
  const category = p.category ?? "project";
  return {
    pk: `PROJECT#${p.id}`,
    sk: "META",
    type: "project",
    GSI1PK: "PROJECT",
    GSI1SK: `${category}#${order}`,
    ...p,
    order: Number(order),
  };
}

async function seedContent() {
  console.log("사이트 텍스트(content) 이전…");
  for (const [lang, data] of [
    ["ko", contentKo],
    ["en", contentEn],
  ] as const) {
    await doc.send(
      new PutCommand({
        TableName: TABLE,
        Item: { pk: `CONTENT#${lang}`, sk: "META", type: "content", lang, data },
      }),
    );
    console.log(`  ✅ content#${lang}`);
  }
}

async function seedProjects() {
  const items = (contentKo.projects?.items ?? []) as Project[];
  if (items.length === 0) {
    console.log("이전할 프로젝트가 없습니다.");
    return;
  }
  console.log(`프로젝트 ${items.length}개 이전…`);
  for (const [i, p] of items.entries()) {
    if (!p.id) {
      console.warn(`  ⚠️  id 없는 프로젝트 건너뜀 (index ${i})`);
      continue;
    }
    await doc.send(new PutCommand({ TableName: TABLE, Item: projectItem(p, i) }));
    console.log(`  ✅ ${p.id} (${p.title ?? p.name ?? ""})`);
  }
}

async function main() {
  console.log(`${TABLE} (${REGION}) 로 데이터 이전 시작…`);
  await seedContent();
  await seedProjects();
  console.log("완료!");
}

main().catch((e) => {
  console.error("시드 실패:", e);
  process.exit(1);
});
