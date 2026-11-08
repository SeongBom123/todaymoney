import type { MarketFacts } from "./types.ts";

// 화면 확인/테스트용 가짜 데이터. 이 데이터로 만든 기사는 sample: true로 표시됩니다.
export function sampleFacts(now = new Date()): MarketFacts[] {
  const label = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" }).format(now);
  return [
    {
      category: "stock", topic: "stock-close", headlineHint: "국내 증시(코스피·코스닥) 장 마감 시황, 전 거래일 대비 등락",
      asOf: now, asOfLabel: `${label} 장 마감 기준`,
      quotes: [
        { name: "코스피", value: 2687.42, prev: 2661.15, unit: "pt", decimals: 2, extra: { "거래대금": "9조 8,420억원" } },
        { name: "코스닥", value: 768.31, prev: 772.9, unit: "pt", decimals: 2, extra: { "거래대금": "7조 1,250억원" } },
        { name: "코스피 200", value: 358.77, prev: 354.62, unit: "pt", decimals: 2 },
      ],
      sources: [{ name: "샘플 데이터" }],
    },
    {
      category: "fx", topic: "fx-daily", headlineHint: "주요 통화의 원화 환율(매매기준율), 직전 영업일 대비 등락",
      asOf: now, asOfLabel: `${label} 매매기준율`,
      quotes: [
        { name: "원·달러", value: 1384.5, prev: 1379.8, unit: "원", decimals: 2 },
        { name: "원·엔(100엔)", value: 908.12, prev: 911.35, unit: "원", decimals: 2 },
        { name: "원·유로", value: 1497.33, prev: 1497.33, unit: "원", decimals: 2 },
        { name: "원·위안", value: 192.41, prev: 191.88, unit: "원", decimals: 2 },
      ],
      sources: [{ name: "샘플 데이터" }],
    },
    {
      category: "crypto", topic: "crypto-daily", headlineHint: "국내 원화 코인 시장 주요 코인 시세, 전일 대비 등락",
      asOf: now, asOfLabel: `${label} 오후 4시 기준`,
      quotes: [
        { name: "비트코인", value: 142350000, prev: 139800000, unit: "원", decimals: 0, extra: { "24시간 거래대금": "1조 2,310억원" } },
        { name: "이더리움", value: 5124000, prev: 5231000, unit: "원", decimals: 0 },
        { name: "리플", value: 3412, prev: 3298, unit: "원", decimals: 0 },
        { name: "솔라나", value: 271500, prev: 268900, unit: "원", decimals: 0 },
        { name: "도지코인", value: 512.4, prev: 520.1, unit: "원", decimals: 1 },
      ],
      sources: [{ name: "샘플 데이터" }],
    },
  ];
}
