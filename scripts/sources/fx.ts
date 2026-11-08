import type { MarketFacts, Quote } from "./types.ts";

// 한국은행 ECOS: 731Y001 = 주요국 통화의 대원화환율(일별, 매매기준율)
// https://ecos.bok.or.kr/api/  (무료 API 키 필요: ECOS_API_KEY)
const ITEMS: [string, string, string][] = [
  ["0000001", "원·달러", "원"],
  ["0000002", "원·엔(100엔)", "원"],
  ["0000003", "원·유로", "원"],
  ["0000053", "원·위안", "원"],
];

const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d).replaceAll("-", "");

export async function fetchFx(now = new Date()): Promise<MarketFacts> {
  const key = process.env.ECOS_API_KEY;
  if (!key) throw new Error("ECOS_API_KEY가 없습니다");
  const start = ymd(new Date(now.getTime() - 14 * 86400e3));
  const end = ymd(now);
  const quotes: Quote[] = [];
  let lastDate = "";
  for (const [code, name, unit] of ITEMS) {
    const u = `https://ecos.bok.or.kr/api/StatisticSearch/${key}/json/kr/1/30/731Y001/D/${start}/${end}/${code}`;
    const res = await fetch(u);
    if (!res.ok) throw new Error(`ECOS API 오류: ${res.status}`);
    const json = (await res.json()) as { StatisticSearch?: { row: { TIME: string; DATA_VALUE: string }[] } };
    const rows = json.StatisticSearch?.row ?? [];
    if (rows.length < 2) throw new Error(`ECOS ${name} 데이터 부족`);
    const [p, c] = rows.slice(-2);
    lastDate = c.TIME;
    quotes.push({ name, value: Number(c.DATA_VALUE), prev: Number(p.DATA_VALUE), unit, decimals: 2 });
  }
  const asOf = new Date(`${lastDate.slice(0, 4)}-${lastDate.slice(4, 6)}-${lastDate.slice(6, 8)}T15:30:00+09:00`);
  return {
    category: "fx", topic: "fx-daily",
    headlineHint: "주요 통화의 원화 환율(한국은행 매매기준율), 직전 영업일 대비 등락",
    asOf, asOfLabel: `${Number(lastDate.slice(4, 6))}월 ${Number(lastDate.slice(6, 8))}일 매매기준율`,
    quotes, sources: [{ name: "한국은행 경제통계시스템(ECOS)", url: "https://ecos.bok.or.kr" }],
  };
}
