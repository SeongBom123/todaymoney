// 수집한 시장 데이터를 기사로 만들기 전의 공통 형태
export type Direction = "up" | "down" | "flat";

export interface Quote {
  name: string;        // 예: "코스피", "원·달러", "비트코인"
  value: number;       // 현재(마감) 값
  prev: number;        // 직전 값 (전일 종가 등)
  unit: string;        // "pt", "원", ...
  decimals: number;    // 표시할 소수 자릿수
  extra?: Record<string, string>; // 거래대금 등 부가정보 (이미 포맷된 문자열)
}

export interface MarketFacts {
  category: "stock" | "fx" | "crypto";
  topic: string;          // 파일 이름에 쓰일 영문 키: "stock-close" 등
  headlineHint: string;   // 기사 주제 설명 (Claude에게 전달)
  asOf: Date;             // 데이터 기준 시각
  asOfLabel: string;      // "11월 7일 장 마감 기준" 같은 표시용 문구
  quotes: Quote[];
  sources: { name: string; url?: string }[];
}
