// 사용법:
//   node scripts/generate.ts            실제 데이터로 기사 생성 (키가 있는 출처만)
//   node scripts/generate.ts --sample   샘플 데이터로 기사 생성 (화면 확인용)
//   node scripts/generate.ts --only=crypto,fx
import fs from "node:fs";
import path from "node:path";
import type { MarketFacts } from "./sources/types.ts";
import { fetchCrypto } from "./sources/crypto.ts";
import { fetchFx } from "./sources/fx.ts";
import { fetchStock } from "./sources/stock.ts";
import { sampleFacts } from "./sources/sample.ts";
import { writeArticle } from "./writer.ts";
import { factsTable, signed } from "./format.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const ARTICLES = path.join(ROOT, "src/content/articles");
const args = process.argv.slice(2);
const isSample = args.includes("--sample");
const only = args.find((a) => a.startsWith("--only="))?.slice(7).split(",");

const kstDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);
const yaml = (s: string) => JSON.stringify(s); // JSON 문자열은 YAML에서도 유효

async function collect(): Promise<MarketFacts[]> {
  if (isSample) return sampleFacts();
  const jobs: [string, () => Promise<MarketFacts>][] = [
    ["stock", fetchStock], ["fx", fetchFx], ["crypto", () => fetchCrypto()],
  ];
  const out: MarketFacts[] = [];
  for (const [name, fn] of jobs) {
    if (only && !only.includes(name)) continue;
    try {
      out.push(await fn());
      console.log(`✓ ${name} 데이터 수집`);
    } catch (e) {
      console.warn(`✗ ${name} 건너뜀: ${(e as Error).message}`);
    }
  }
  return out;
}

async function main() {
  const factsList = await collect();
  if (factsList.length === 0) {
    console.error("수집된 데이터가 없습니다. API 키와 네트워크를 확인하세요.");
    process.exit(1);
  }
  fs.mkdirSync(ARTICLES, { recursive: true });
  const ticker: object[] = [];

  for (const facts of factsList) {
    console.log(`\n▶ ${facts.topic} 기사 작성 중…`);
    const { draft, fq } = await writeArticle(facts);
    const date = kstDate(facts.asOf);
    const slug = `${date}-${facts.topic}${isSample ? "-sample" : ""}`;
    const front = [
      "---",
      `title: ${yaml(draft.title)}`,
      `summary: ${yaml(draft.summary)}`,
      `category: ${facts.category}`,
      `date: ${new Date().toISOString()}`,
      `tags: [${draft.tags.map(yaml).join(", ")}]`,
      `aiGenerated: ${draft.writer === "claude"}`,
      `sample: ${isSample}`,
      `sources:`,
      ...facts.sources.map((s) => `  - { name: ${yaml(s.name)}${s.url ? `, url: ${yaml(s.url)}` : ""} }`),
      `keyFigures:`,
      ...fq.slice(0, 4).map((f) => `  - { label: ${yaml(f.name)}, value: ${yaml(f.value)}, change: ${yaml(signed(f))}, direction: ${f.direction} }`),
      "---",
    ].join("\n");
    const body = [...draft.paragraphs, `## 주요 지표 (${facts.asOfLabel})`, factsTable(facts, fq)].join("\n\n") + "\n";
    const file = path.join(ARTICLES, `${slug}.md`);
    fs.writeFileSync(file, `${front}\n\n${body}`);
    console.log(`  저장: ${path.relative(ROOT, file)} (작성: ${draft.writer})`);
    ticker.push(...fq.slice(0, 2).map((f) => ({ label: f.name, value: f.value, change: signed(f), direction: f.direction })));
  }

  if (!isSample) {
    fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
    fs.writeFileSync(path.join(ROOT, "data/latest.json"), JSON.stringify({ updatedAt: new Date().toISOString(), asOfLabel: `${kstDate(new Date())} 업데이트`, ticker }, null, 2) + "\n");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
