import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { MarketFacts } from "./sources/types.ts";
import { formatQuote, signed, type FormattedQuote } from "./format.ts";
import { allowedNumbers, findUnverified } from "./verify.ts";

export interface Draft {
  title: string;
  summary: string;
  paragraphs: string[];
  tags: string[];
  writer: "claude" | "template";
}

const DraftSchema = z.object({
  title: z.string().describe("기사 제목. 40자 이내. 핵심 지표와 방향을 담는다"),
  summary: z.string().describe("기사 요약 1~2문장"),
  paragraphs: z.array(z.string()).describe("본문 문단 3~5개"),
  tags: z.array(z.string()).describe("태그 3~5개 (예: 코스피, 환율)"),
});

const SYSTEM = `당신은 경제 뉴스 사이트 '오늘의돈'의 시황 기자입니다. 주어진 데이터만으로 한국어 시황 기사를 씁니다.

규칙:
- 숫자는 반드시 입력 데이터에 있는 문자열을 그대로 씁니다(쉼표·소수점 포함). 계산하거나 반올림하거나 새 숫자를 만들지 않습니다.
- "3일 연속", "연중 최고" 등 데이터에 없는 사실, 원인 추정(외국인 매수, 금리 기대 등), 전망은 쓰지 않습니다. 데이터로 확인되는 등락과 비교만 서술합니다.
- 특정 종목·자산의 매수·매도를 권하거나 투자 판단을 유도하는 표현을 쓰지 않습니다.
- 문체는 간결한 신문 기사체(~했다, ~로 집계됐다)입니다. 과장된 수식어나 낚시성 표현을 쓰지 않습니다.
- 상승/하락/보합 표현은 입력의 directionWord를 따릅니다.`;

function factsPayload(facts: MarketFacts, fq: FormattedQuote[]) {
  return {
    주제: facts.headlineHint,
    기준: facts.asOfLabel,
    지표: fq.map((f) => ({ name: f.name, value: f.valueWithUnit, diff: f.diff, pct: f.pct, directionWord: f.directionWord, ...f.extra })),
  };
}

export async function writeArticle(facts: MarketFacts): Promise<{ draft: Draft; fq: FormattedQuote[] }> {
  const fq = facts.quotes.map(formatQuote);
  const allowed = allowedNumbers(facts, fq);

  if (process.env.ANTHROPIC_API_KEY) {
    const client = new Anthropic();
    let feedback = "";
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await client.beta.messages.parse({
          model: "claude-opus-5-5",
          max_tokens: 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "medium", format: betaZodOutputFormat(DraftSchema) },
          system: SYSTEM,
          messages: [{
            role: "user",
            content: `다음 데이터로 시황 기사를 작성하세요.\n\n${JSON.stringify(factsPayload(facts, fq), null, 2)}${feedback}`,
          }],
        });
        if (res.stop_reason === "refusal" || !res.parsed_output) {
          console.warn(`  [Claude] 응답을 사용할 수 없음 (stop_reason=${res.stop_reason})`);
          break;
        }
        const out = res.parsed_output;
        const bad = findUnverified([out.title, out.summary, ...out.paragraphs].join("\n"), allowed);
        if (bad.length === 0) return { draft: { ...out, writer: "claude" }, fq };
        console.warn(`  [검증 실패 ${attempt}회차] 출처 없는 숫자: ${bad.join(", ")}`);
        feedback = `\n\n주의: 이전 초안에 데이터에 없는 숫자(${bad.join(", ")})가 있었습니다. 데이터의 숫자만 사용하세요.`;
      } catch (err) {
        if (err instanceof Anthropic.APIError) {
          console.warn(`  [Claude API 오류 ${err.status}] ${err.message}`);
          break;
        }
        throw err;
      }
    }
    console.warn("  → 템플릿 문장으로 대체합니다.");
  }
  return { draft: templateDraft(facts, fq), fq };
}

// API 키가 없거나 검증에 실패했을 때 쓰는 규칙 기반 기사
export function templateDraft(facts: MarketFacts, fq: FormattedQuote[]): Draft {
  const [main, ...others] = fq;
  const verb = (f: FormattedQuote) =>
    f.direction === "flat" ? "보합을 기록했다" : `${f.diff}${unitOf(facts, f)}(${f.pct}) ${f.directionWord}했다`;
  const ups = fq.filter((f) => f.direction === "up").map((f) => f.name);
  const downs = fq.filter((f) => f.direction === "down").map((f) => f.name);

  const titles: Record<MarketFacts["category"], string> = {
    stock: `${main.name} ${main.value} 마감… ${main.pct} ${main.directionWord}`,
    fx: `${main.name} 환율 ${main.valueWithUnit}… 전일 대비 ${main.diff}원 ${main.directionWord}`,
    crypto: `${main.name} ${main.valueWithUnit}… 하루 새 ${main.pct} ${main.directionWord}`,
  };
  const title = main.direction === "flat" ? `${main.name} ${main.valueWithUnit} 보합` : titles[facts.category];

  const paragraphs = [
    `${facts.asOfLabel}, ${josa(main.name, "은", "는")} ${ro(main.valueWithUnit)} 직전 대비 ${verb(main)}.`,
    ...others.map((f) => `${josa(f.name, "은", "는")} ${ro(f.valueWithUnit)} ${verb(f)}.`),
  ];
  const tally = [ups.length && `상승 ${ups.length}개(${ups.join(", ")})`, downs.length && `하락 ${downs.length}개(${downs.join(", ")})`].filter(Boolean).join(", ");
  if (tally) paragraphs.push(`이날 주요 지표 ${fq.length}개 가운데 ${tally}로 집계됐다.`);

  return {
    title,
    summary: `${main.name} ${main.valueWithUnit} (${signed(main)}). ${others.slice(0, 2).map((f) => `${f.name} ${signed(f)}`).join(", ")}.`,
    paragraphs,
    tags: fq.slice(0, 4).map((f) => f.name),
    writer: "template",
  };
}

const unitOf = (facts: MarketFacts, f: FormattedQuote) => facts.quotes.find((q) => q.name === f.name)?.unit ?? "";

// 받침 유무에 따라 조사를 고릅니다. (예: 코스피는 / 코스닥은)
export function josa(word: string, withBatchim: string, without: string) {
  const ch = word.replace(/[\s)\]]+$/, "").slice(-1);
  const code = ch.charCodeAt(0);
  let has: boolean;
  if (code >= 0xac00 && code <= 0xd7a3) has = (code - 0xac00) % 28 !== 0;
  else if (/[0-9]/.test(ch)) has = "013678".includes(ch); // 영, 일, 삼, 육, 칠, 팔
  else has = false;
  return `${word}${has ? withBatchim : without}`;
}

// "1,384.50원" → "1,384.50원으로", "2,687.42pt" → "2,687.42pt로"
const ro = (v: string) => `${v}${v.endsWith("원") ? "으로" : "로"}`;
