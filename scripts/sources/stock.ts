import type { MarketFacts, Quote } from "./types.ts";

// 공공데이터포털: 금융위원회_지수시세정보 (DATA_GO_KR_KEY 필요)
// 이 API는 보통 다음 영업일 오후에 전일 마감 데이터가 올라옵니다.
const URL_BASE = "https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex";
const INDEXES = ["코스피", "코스닥", "코스피 200"];

export async function fetchStock(): Promise<MarketFacts> {
  const key = process.env.DATA_GO_KR_KEY;
  if (!key) throw new Error("DATA_GO_KR_KEY가 없습니다");
  const quotes: Quote[] = [];
  let basDt = "";
  for (const idx of INDEXES) {
    const u = `${URL_BASE}?serviceKey=${encodeURIComponent(key)}&resultType=json&numOfRows=1&pageNo=1&idxNm=${encodeURIComponent(idx)}`;
    const res = await fetch(u);
    if (!res.ok) throw new Error(`공공데이터 API 오류: ${res.status}`);
    const json = (await res.json()) as any;
    const item = json?.response?.body?.items?.item?.[0];
    if (!item) throw new Error(`${idx} 데이터가 없습니다`);
    basDt = item.basDt;
    const value = Number(item.clpr);
    quotes.push({
      name: idx, value, prev: value - Number(item.vs), unit: "pt", decimals: 2,
      extra: { "거래대금": `${Math.round(Number(item.trPrc) / 1e8).toLocaleString("ko-KR")}억원` },
    });
  }
  const asOf = new Date(`${basDt.slice(0, 4)}-${basDt.slice(4, 6)}-${basDt.slice(6, 8)}T15:30:00+09:00`);
  return {
    category: "stock", topic: "stock-close",
    headlineHint: "국내 증시(코스피·코스닥) 장 마감 시황, 전 거래일 대비 등락",
    asOf, asOfLabel: `${Number(basDt.slice(4, 6))}월 ${Number(basDt.slice(6, 8))}일 장 마감 기준`,
    quotes, sources: [{ name: "금융위원회 지수시세정보(공공데이터포털)", url: "https://www.data.go.kr" }],
  };
}
