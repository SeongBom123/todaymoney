import type { Direction, MarketFacts, Quote } from "./sources/types.ts";

// 모든 숫자 표기는 코드에서 만들고, AI는 이 문자열만 그대로 쓰도록 합니다.
export interface FormattedQuote {
  name: string;
  value: string;      // "2,687.42"
  valueWithUnit: string; // "2,687.42pt"
  diff: string;       // "26.27"
  pct: string;        // "0.99%"
  direction: Direction;
  directionWord: string; // "상승" | "하락" | "보합"
  extra: Record<string, string>;
}

const num = (n: number, d: number) => n.toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });

export function formatQuote(q: Quote): FormattedQuote {
  const diffRaw = q.value - q.prev;
  const pctRaw = q.prev === 0 ? 0 : (diffRaw / q.prev) * 100;
  const diff = Number(diffRaw.toFixed(q.decimals));
  const pct = Number(pctRaw.toFixed(2));
  const direction: Direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  return {
    name: q.name,
    value: num(q.value, q.decimals),
    valueWithUnit: `${num(q.value, q.decimals)}${q.unit}`,
    diff: num(Math.abs(diff), q.decimals),
    pct: `${num(Math.abs(pct), 2)}%`,
    direction,
    directionWord: direction === "up" ? "상승" : direction === "down" ? "하락" : "보합",
    extra: q.extra ?? {},
  };
}

export const signed = (f: FormattedQuote) =>
  f.direction === "flat" ? "0.00%" : `${f.direction === "up" ? "+" : "-"}${f.pct}`;

export function factsTable(facts: MarketFacts, fq: FormattedQuote[]) {
  const unit = facts.quotes[0]?.unit ?? "";
  const extraKeys = [...new Set(fq.flatMap((f) => Object.keys(f.extra)))];
  const head = `| 구분 | 현재(${unit}) | 전일 대비 | 등락률 |${extraKeys.map((k) => ` ${k} |`).join("")}`;
  const sep = `|---|---:|---:|---:|${extraKeys.map(() => "---:|").join("")}`;
  const arrow = { up: "▲", down: "▼", flat: "-" };
  const rows = fq.map((f) =>
    `| ${f.name} | ${f.value} | <span class="${f.direction}">${arrow[f.direction]} ${f.diff}</span> | <span class="${f.direction}">${signed(f)}</span> |${extraKeys.map((k) => ` ${f.extra[k] ?? "-"} |`).join("")}`,
  );
  return [head, sep, ...rows].join("\n");
}
