# 오늘의돈 (todaymoney)

숫자로 읽는 오늘의 경제. 증시·환율·코인 시황을 공개 데이터로 매일 자동 작성하는 경제 뉴스 사이트입니다.

## 구조

```
src/                   Astro 사이트 (메인, 카테고리, 기사, 소개 페이지)
src/content/articles/  기사 Markdown 파일 (자동 생성)
scripts/generate.ts    데이터 수집 → 기사 작성 → 숫자 검증 → 저장
scripts/sources/       데이터 출처별 수집기 (업비트, 한국은행 ECOS, 공공데이터포털)
scripts/writer.ts      Claude로 기사 작성 (키가 없으면 템플릿 문장)
scripts/verify.ts      기사 속 숫자가 원본 데이터에 있는지 검사
data/latest.json       상단 시세 띠에 쓰는 최신 값
.github/workflows/     매일 자동 실행 + GitHub Pages 배포
```

## 기사 작성 원칙

- 숫자는 코드가 원본 데이터에서 만들고, AI는 그 문자열만 그대로 씁니다.
- 기사에 원본에 없는 숫자가 나오면 한 번 다시 쓰게 하고, 그래도 틀리면 템플릿 문장으로 대체합니다.
- AI 작성 표시와 투자 권유 아님 문구를 모든 기사에 붙입니다.

## 로컬 실행

```bash
npm install
npm run generate:sample   # 샘플 데이터로 기사 생성
npm run dev               # http://localhost:4321/todaymoney/
```

실제 데이터로 생성하려면 `.env.example`을 참고해 키를 설정한 뒤 `npm run generate`를 실행합니다.
코인(업비트)은 키 없이 동작합니다.

## 자동 운영 설정 (GitHub)

1. **Settings → Pages → Source**를 `GitHub Actions`로 설정 (무료 계정은 Public 저장소만 가능)
2. **Settings → Secrets and variables → Actions**에 키 등록
   - `ANTHROPIC_API_KEY` — Claude API (없으면 템플릿 문장으로 작성)
   - `ECOS_API_KEY` — 한국은행 ECOS (환율)
   - `DATA_GO_KR_KEY` — 공공데이터포털 금융위원회_지수시세정보 (증시)
3. 매일 16:13(KST)에 자동 실행됩니다. **Actions → 매일 기사 생성 및 배포 → Run workflow**로 바로 실행할 수도 있습니다.

## 참고

- 증시 데이터(공공데이터포털)는 보통 다음 영업일에 전일 마감 값이 올라옵니다. 같은 날짜 기사는 덮어쓰므로 중복되지 않습니다.
- 샘플 기사(`*-sample.md`)는 실제 기사가 쌓이면 삭제하세요.
