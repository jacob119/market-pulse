# CLAUDE.md - MarketPulse 프로젝트 가이드

> **MarketPulse**: AI 기반 주식 분석 + 투자 대시보드
> MarketPulse 팀 (11인 에이전트) = 총괄 1 + 분석 6 + 개발 2 + 품질 1 + 배포 1
> Claude Code CLI 기반 (API 크레딧 불필요) · 병렬 실행 최대 2개

---

## 1. 프로젝트 개요

MarketPulse는 한국/미국 주식 시장의 AI 분석, 자동 매매, 실시간 대시보드를 통합한 투자 플랫폼입니다.

- **MarketPulse 팀 (11인)**: 총괄 + 분석 6인 + 프론트엔드 + UX + QA + DevOps
- **MarketPulse 분석 엔진**: 13개 전문 AI 에이전트 (기술, 수급, 재무, 산업, 뉴스, 시장, 전략, 거시, 요약, 평가, 번역, 매수, 매도)
- **Claude Code CLI** (`claude -p`) 기반 실행 -- Claude API 직접 호출 금지

---

## 2. 디렉토리 구조

```
prism-alpha/
├── cores/                              # AI 분석 엔진
│   ├── agents/                         # 13개 전문 AI 에이전트
│   │   ├── stock_price_agents.py       #   기술분석 + 수급분석
│   │   ├── company_info_agents.py      #   재무분석 + 산업분석
│   │   ├── news_strategy_agents.py     #   뉴스분석 + 투자전략
│   │   ├── market_index_agents.py      #   시장분석 (KOSPI/KOSDAQ)
│   │   ├── macro_intelligence_agent.py #   거시경제 인텔리전스
│   │   ├── trading_agents.py           #   매수/매도 전문가
│   │   ├── trading_journal_agent.py    #   매매일지
│   │   ├── telegram_summary_optimizer_agent.py  # 텔레그램 요약
│   │   ├── telegram_summary_evaluator_agent.py  # 요약 품질평가
│   │   ├── telegram_translator_agent.py         # 다국어 번역
│   │   └── memory_compressor_agent.py  #   메모리 압축
│   ├── chatgpt_proxy/                  # ChatGPT OAuth 프록시
│   ├── llm_client.py                   # LLM 클라이언트
│   ├── agent_runner.py                 # 에이전트 실행기
│   ├── analysis.py                     # 핵심 분석 오케스트레이션
│   ├── report_generation.py            # 리포트 템플릿
│   ├── data_prefetch.py                # 데이터 병렬 수집
│   ├── stock_chart.py                  # 차트 생성
│   └── company_name_translator.py      # 종목명 번역
│
├── pipeline/                           # 파이프라인
│   ├── daily_pipeline.py               # 일일 통합 파이프라인 (21:00 crontab)
│   ├── macro_pipeline.py               # 거시경제 파이프라인
│   ├── stock_pipeline.py               # 종목 분석 파이프라인
│   ├── news_crawler.py                 # 뉴스 크롤링 (RSS + YouTube)
│   ├── news_analyzer.py                # 뉴스 분석
│   ├── watchlist_analyzer.py           # 보유+관심종목 분석
│   ├── realtime_server.py              # 실시간 서버 (시세 1분 + 뉴스 5분)
│   └── archive_pipeline.py             # 리포트 아카이브
│
├── examples/
│   ├── dashboard/                      # Next.js 대시보드
│   │   ├── app/                        #   App Router (page.tsx, layout.tsx)
│   │   │   └── landing/               #   랜딩 페이지
│   │   ├── components/                 #   20+ UI 컴포넌트
│   │   │   ├── holdings-table.tsx      #     보유종목 테이블
│   │   │   ├── metrics-cards.tsx       #     지표 카드
│   │   │   ├── performance-chart.tsx   #     수익률 차트
│   │   │   ├── news-page.tsx           #     뉴스 페이지
│   │   │   ├── portfolio-page.tsx      #     포트폴리오 페이지
│   │   │   ├── trading-history-page.tsx#     매매 이력
│   │   │   ├── ai-decisions-page.tsx   #     AI 판단 내역
│   │   │   └── ...                     #     기타 컴포넌트
│   │   ├── e2e/                        #   E2E 테스트 (Playwright)
│   │   │   └── dashboard.spec.ts       #     25개 테스트
│   │   ├── hooks/                      #   React 훅
│   │   ├── lib/                        #   유틸리티
│   │   ├── types/                      #   TypeScript 타입 정의
│   │   ├── styles/                     #   스타일
│   │   └── public/                     #   정적 파일
│   ├── generate_dashboard_json.py      # 대시보드 데이터 생성 (KR)
│   ├── generate_us_dashboard_json.py   # 대시보드 데이터 생성 (US)
│   ├── landing/                        # 랜딩 페이지
│   ├── messaging/                      # 메시징 예제
│   └── streamlit/                      # Streamlit 대시보드
│
├── .claude/agents/                     # Investment Alpha 에이전트 정의
│   ├── chief-analyst.md                # 종합 분석가
│   ├── macro-economist.md              # 거시경제 전문가
│   ├── commodity-analyst.md            # 금/은 원자재 분석가
│   ├── stock-analyst.md                # 주식 전문가
│   ├── real-estate-analyst.md          # 부동산 전문가
│   └── monthly-reporter.md            # 월별 리포트 작성자
│
├── scripts/                            # 실행 스크립트
│   ├── daily_run.sh                    # 일일 파이프라인 실행
│   ├── realtime.sh                     # 실시간 서버 실행
│   ├── news_update.sh                  # 뉴스 업데이트
│   └── generate_dashboard_data.py      # 대시보드 데이터 생성
│
├── trading/                            # KIS API 매매 (한국)
│   ├── config/
│   │   ├── kis_devlp.yaml              # KIS API 인증 설정
│   │   └── kis_devlp.yaml.example      # 설정 예시
│   ├── domestic_stock_trading.py       # 국내 주식 매매
│   ├── kis_auth.py                     # KIS 인증
│   ├── portfolio_telegram_reporter.py  # 포트폴리오 텔레그램 리포트
│   └── samples/                        # 매매 예제
│
├── prism-us/                           # 미국 주식 모듈
│   ├── cores/agents/                   # US 전용 에이전트
│   ├── trading/                        # KIS 해외주식 API
│   ├── tracking/                       # US 종목 추적
│   ├── us_stock_analysis_orchestrator.py
│   ├── us_trigger_batch.py
│   ├── us_pending_order_batch.py
│   ├── us_stock_tracking_agent.py
│   └── us_telegram_summary_agent.py
│
├── tracking/                           # 종목 추적
│   ├── helpers.py                      # 헬퍼 함수
│   ├── journal.py                      # 매매 일지
│   ├── trading_ops.py                  # 매매 연산
│   ├── compression.py                  # 데이터 압축
│   ├── db_schema.py                    # DB 스키마
│   ├── telegram.py                     # 텔레그램 연동
│   └── user_memory.py                  # 사용자 메모리
│
├── messaging/                          # 메시징 (Redis, GCP Pub/Sub)
│   ├── redis_signal_publisher.py
│   ├── gcp_pubsub_signal_publisher.py
│   └── redis_health_check.py
│
├── events/                             # 이벤트 (전세 가격 추적)
│   ├── jeoningu_trading.py
│   ├── jeoningu_price_fetcher.py
│   └── jeoningu_trading_db.py
│
├── reports/                            # 리포트 저장
│   ├── macro/                          # 거시경제 리포트 (MD + HTML)
│   ├── stocks/                         # 종목별 분석 리포트
│   └── archive/                        # 아카이브
│
├── tests/                              # 테스트 스위트
│   ├── test_async_trading.py
│   ├── test_json_parsing.py
│   ├── test_krx_api.py
│   ├── test_trading_journal.py
│   └── ...                             # 20+ 테스트 파일
│
├── utils/                              # 유틸리티
│   ├── setup_crontab.sh
│   ├── setup_playwright.sh
│   ├── cleanup_logs.sh
│   └── migrate_*.py                    # 마이그레이션 스크립트
│
├── docs/                               # 문서
│   ├── CLAUDE_AGENTS.md                # 에이전트 상세 문서
│   ├── SETUP.md / SETUP_ko.md         # 설치 가이드
│   ├── TRADING_JOURNAL.md              # 매매일지 가이드
│   └── ...
│
├── docker/                             # Docker 설정
├── sqlite/                             # SQLite 연동 (pyproject.toml)
├── telegram_messages/                  # 텔레그램 메시지 저장
├── pdf_reports/                        # PDF 리포트 출력
├── output/                             # 분석 결과 출력
├── assets/                             # 로고 등 자산
│
├── stock_analysis_orchestrator.py      # KR 분석 오케스트레이터 (메인)
├── trigger_batch.py                    # KR 트리거 배치 (급등/모멘텀 감지)
├── stock_tracking_agent.py             # KR 종목 추적 에이전트
├── stock_tracking_enhanced_agent.py    # 향상된 추적 에이전트
├── telegram_ai_bot.py                  # 텔레그램 AI 봇
├── telegram_bot_agent.py               # 텔레그램 봇 에이전트
├── telegram_summary_agent.py           # 텔레그램 요약 에이전트
├── report_generator.py                 # 리포트 생성기
├── performance_analysis_report.py      # 성과 분석 리포트
├── performance_tracker_batch.py        # 성과 추적 배치
├── weekly_insight_report.py            # 주간 인사이트 리포트
├── demo.py                             # 단일 종목 데모
├── pdf_converter.py                    # PDF 변환 (pandoc + Chrome headless)
├── firebase_bridge.py                  # Firebase 푸시 알림
├── analysis_manager.py                 # 분석 매니저
├── update_stock_data.py                # 주가 데이터 업데이트
├── run_telegram_pipeline.py            # 텔레그램 파이프라인
├── compress_trading_memory.py          # 매매 메모리 압축
│
├── requirements.txt                    # Python 의존성
├── stock_map.json                      # 종목 맵핑
├── mcp_agent.config.yaml               # MCP 에이전트 설정
├── docker-compose.yml                  # Docker Compose
└── Dockerfile                          # Docker 이미지
```

---

## 3. 핵심 명령어

```bash
# 대시보드 실행
cd examples/dashboard && npm run dev

# 실시간 서버 (시세 1분 + 뉴스 5분)
./scripts/realtime.sh

# 일일 파이프라인
./scripts/daily_run.sh all

# 뉴스 크롤링
python3 pipeline/news_crawler.py

# E2E 테스트
cd examples/dashboard && npx playwright test

# 대시보드 빌드 확인
cd examples/dashboard && npx next build

# 단일 종목 분석 (KR)
python demo.py 005930

# 단일 종목 분석 (US)
python demo.py AAPL --market us

# KR 오전 분석
python stock_analysis_orchestrator.py --mode morning

# US 오전 분석
python prism-us/us_stock_analysis_orchestrator.py --mode morning

# 트리거 배치 (급등 감지)
python trigger_batch.py morning INFO

# 주간 리포트
python weekly_insight_report.py --dry-run
```

---

## 4. 데이터 흐름

```
daily_pipeline.py (21:00 crontab)
  ├── macro_pipeline.py    → 거시경제 리포트 생성
  ├── stock_pipeline.py    → 종목 분석 (MarketPulse 13 에이전트)
  ├── realtime_server.py   → KIS API 실시간 시세
  ├── news_crawler.py      → RSS + YouTube + Claude Code 뉴스 수집
  ├── watchlist_analyzer.py → 보유+관심종목 분석
  └── generate_dashboard_data.py → dashboard_data.json → Next.js 대시보드
```

```
trigger_batch.py (오전 자동 실행)
  → 급등/모멘텀 감지 → 후보 종목 JSON
  → stock_analysis_orchestrator.py
    → data_prefetch (병렬 데이터 수집)
    → cores/analysis.py — 6개 분석 에이전트 (순차)
       기술분석 → 수급분석 → 재무분석 → 산업분석 → 뉴스분석 → 시장분석
    → 투자전략가 (6개 리포트 종합)
    → report_generation.py → PDF
    → telegram_summary_agent → 텔레그램 알림 (한국어)
  → stock_tracking_agent.py (독립 크론)
    → 매도 판단 에이전트 → KIS 매도 주문
    → 매수 시그널 → KIS 매수 주문
```

---

## 5. 개발 규칙

### 필수 규칙
- **Claude API 사용 금지** -- Claude Code CLI (`claude -p`) 사용
- 모든 분석은 Investment Alpha chief-analyst 프롬프트 기반
- 컴포넌트 수정 후 **반드시 빌드 확인** (`cd examples/dashboard && npx next build`)
- 데이터 변경 시 **E2E 테스트 실행** (`npx playwright test`)
- 민감 파일 커밋 금지 (`.env`, `secrets`, `token`, `kis_devlp.yaml`)

### 코드 품질
- **NaN/undefined/null 렌더링 방지** -- 모든 데이터에 null 체크 필수
- 티커 변경 시 가격/총투자금/종목명 **연쇄 업데이트 필수**
- KIS API 응답은 빈 문자열 가능 -- `_safe_float()`, `_safe_int()` 사용
- 비동기 패턴 준수 (`async/await`, `requests` 대신 `aiohttp`)
- AI 에이전트는 순차 실행 (rate limit 방지)
- 한국어 리포트는 합쇼체 (높임말) 사용

### 브랜치 규칙
- **코드 파일 변경** (`.py`, `.ts`, `.tsx`, `.js`): feature 브랜치 + PR
- **문서만 변경** (`.md`): main 직접 커밋 허용
- 브랜치 네이밍: `feat/`, `fix/`, `refactor/`, `test/` + 설명

### 커밋 메시지
```
feat: 새 기능
fix: 버그 수정
docs: 문서
refactor: 리팩토링
test: 테스트
```

---

## 6. 테스트

### E2E 테스트 (Playwright) -- 25개
- 위치: `examples/dashboard/e2e/dashboard.spec.ts`
- 실행: `cd examples/dashboard && npx playwright test`
- 범위: 데이터 검증, NaN 방지, 링크 유효성, 가격 일관성, UI 렌더링

### Python 테스트 -- 20+ 파일
- 위치: `tests/`
- 범위: 비동기 매매, JSON 파싱, KRX API, 매매일지, 포트폴리오 리포트 등

---

## 7. 환경 설정

### 필수 의존성
- **Node.js** (Next.js 대시보드)
- **Python 3.11+** (분석 엔진)
- **pykrx** (한국 주가 데이터)
- **feedparser** (RSS 뉴스 수집)
- **Playwright** (E2E 테스트, PDF 생성)

### 설정 파일
| 파일 | 용도 |
|------|------|
| `.env` | 텔레그램 토큰, 채널 ID, Redis/GCP 설정 |
| `mcp_agent.secrets.yaml` | API 키 (OpenAI, Anthropic, Firecrawl 등) |
| `mcp_agent.config.yaml` | MCP 서버 설정 |
| `trading/config/kis_devlp.yaml` | KIS 매매 API 인증 |

### 자동 실행
- **crontab**: 평일 21:00 일일 파이프라인
- **pmset**: 20:55 자동 기상 (macOS)

### Investment Alpha 에이전트 팀

| 역할 | 에이전트 | 파일 |
|------|---------|------|
| 거시경제 전문가 | `macro-economist` | `.claude/agents/macro-economist.md` |
| 금/은 원자재 분석가 | `commodity-analyst` | `.claude/agents/commodity-analyst.md` |
| 주식 전문가 | `stock-analyst` | `.claude/agents/stock-analyst.md` |
| 부동산 전문가 | `real-estate-analyst` | `.claude/agents/real-estate-analyst.md` |
| 종합 분석가 | `chief-analyst` | `.claude/agents/chief-analyst.md` |
| 월별 리포트 작성자 | `monthly-reporter` | `.claude/agents/monthly-reporter.md` |
