import type { MarketFacts } from "./sources/types.ts";
import type { FormattedQuote } from "./format.ts";

// 기사에 나온 숫자가 모두 원본 데이터(또는 날짜)에 있는지 확인합니다.
// 하나라도 출처를 알 수 없는 숫자가 있으면 실패로 처리합니다.
const norm = (s: string) => s.replace(/,/g, "").replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

export function allowedNumbers(facts: MarketFacts, fq: FormattedQuote[]): Set<string> {
  const set = new Set<string>();
  const add = (s: string) => {
    for (const m of s.match(/\d[\d,]*(?:\.\d+)?/g) ?? []) set.add(norm(m));
  };
  for (const f of fq) {
    add(f.value); add(f.diff); add(f.pct);
    Object.values(f.extra).forEach(add);
    add(f.name); // "코스피 200", "100엔" 등 이름 속 숫자
  }
  add(facts.asOfLabel);
  const kst = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(facts.asOf);
  for (const p of kst) if (p.type !== "literal") set.add(String(Number(p.value)));
  return set;
}

export function findUnverified(text: string, allowed: Set<string>): string[] {
  const bad: string[] = [];
  for (const m of text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []) {
    if (!allowed.has(norm(m))) bad.push(m);
  }
  return [...new Set(bad)];
}
