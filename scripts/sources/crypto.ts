import type { MarketFacts, Quote } from "./types.ts";

// 업비트 공개 API (API 키 불필요). https://docs.upbit.com/
const MARKETS: [string, string][] = [
  ["KRW-BTC", "비트코인"],
  ["KRW-ETH", "이더리움"],
  ["KRW-XRP", "리플"],
  ["KRW-SOL", "솔라나"],
  ["KRW-DOGE", "도지코인"],
];

export async function fetchCrypto(now = new Date()): Promise<MarketFacts> {
  const res = await fetch(`https://api.upbit.com/v1/ticker?markets=${MARKETS.map((m) => m[0]).join(",")}`);
  if (!res.ok) throw new Error(`업비트 API 오류: ${res.status}`);
  const rows = (await res.json()) as { market: string; trade_price: number; prev_closing_price: number; acc_trade_price_24h: number }[];
  const quotes: Quote[] = MARKETS.map(([code, name]) => {
    const r = rows.find((x) => x.market === code);
    if (!r) throw new Error(`업비트 응답에 ${code}가 없습니다`);
    return {
      name, value: r.trade_price, prev: r.prev_closing_price, unit: "원",
      decimals: r.trade_price < 100 ? 2 : 0,
      extra: { "24시간 거래대금": `${Math.round(r.acc_trade_price_24h / 1e8).toLocaleString("ko-KR")}억원` },
    };
  });
  return {
    category: "crypto", topic: "crypto-daily",
    headlineHint: "국내 원화 코인 시장(업비트) 주요 코인 시세. 전일 종가(오전 9시 기준) 대비 등락",
    asOf: now, asOfLabel: `${kstLabel(now)} 기준, 업비트 원화마켓`,
    quotes, sources: [{ name: "업비트 공개 API", url: "https://upbit.com" }],
  };
}

export function kstLabel(d: Date) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}
