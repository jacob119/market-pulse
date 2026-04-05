# MarketPulse 기능 명세서

> 대시보드 8개 탭 + 헤더 티커바 + 네이버 차트 연동 + 미니 캔들 차트의 상세 기능 명세

---

## 탭 구성 개요

| 탭 | 컴포넌트 | URL 파라미터 | 설명 |
|----|---------|-------------|------|
| 대시보드 | `page.tsx` (메인) | `/?tab=dashboard` 또는 `/` | 실시간 시세, 급등주, 보유종목, 차트 |
| AI 보유 분석 | `ai-decisions-page.tsx` | `/?tab=ai-decisions` | 20종목 전략 판단 |
| 거래 내역 | `trading-history-page.tsx` | `/?tab=trading` | 매매 기록 및 성과 |
| 관심종목 | `watchlist-page.tsx` | `/?tab=watchlist` | 30종목 퀀트 스크리닝 |
| 인사이트 | `trading-insights-page.tsx` | `/?tab=insights` | 트레이딩 원칙, 저널, 직관 |
| 포트폴리오 | `portfolio-page.tsx` | `/?tab=portfolio` | 실제 보유 종목 CRUD |
| 뉴스 | `news-page.tsx` | `/?tab=news` | 워드클라우드, 감정분석 |
| 리포트 | `reports-page.tsx` | `/?tab=jeoningu-lab` | Investment Alpha 리포트 뷰어 |

---

## 1. 대시보드 탭 (메인)

**컴포넌트**: `app/page.tsx` + `metrics-cards.tsx` + `holdings-table.tsx` + `performance-chart.tsx`

### 1.1 실시간 시장 지표 배너

- KOSPI, KOSDAQ 지수를 `realtime` 데이터에서 표시
- 상승/하락에 따라 초록/빨강 색상 구분
- 6열 그리드 레이아웃 (모바일 3열)

### 1.2 급등주 TOP 5

- KIS API `get_top_gainers(5)` 데이터 표시
- 빨강/주황 그라데이션 배경 카드
- 종목명, 현재가, 등락률(%) 표시
- 마지막 갱신 시각 표시

### 1.3 트리거 신뢰도 배지

- `trigger-reliability-badge.tsx` 컴포넌트
- `trading_insights.trigger_reliability` 데이터 기반
- 클릭 시 인사이트 탭으로 이동

### 1.4 핵심 지표 카드 (`metrics-cards.tsx`)

- 총 자산 가치, 총 수익률
- 거래 횟수, 승률, 평균 수익률
- 평균 보유 기간, 승리/패배 횟수
- 한국/미국 시장별 통화 포맷 자동 전환

### 1.5 보유종목 테이블 (`holdings-table.tsx`)

- **실전투자 포트폴리오**: `real_portfolio` 데이터 (최우선 표시)
- **프리즘 시뮬레이터**: `holdings` 데이터
- 각 종목 행:
  - 종목명 (네이버 차트 링크)
  - 미니 캔들 차트 (당일 OHLC)
  - 현재가, 수익률 (색상 구분)
  - AI 전략 배지 (매수/매도/홀드/관망)
  - 섹터 배지
  - 목표가/손절가
  - 비중(%)
- 행 확장: 전략 사유, 포트폴리오 분석, 섹터 전망, 시장 환경 상세 표시
- 행 클릭: `StockDetailModal` 오픈

### 1.6 시장 차트 (`performance-chart.tsx`)

- Recharts 기반 시계열 차트
- KOSPI/KOSDAQ 지수 추이
- MarketPulse 시뮬레이터 수익률 그래프

### 1.7 운영 비용 카드 (`operating-costs-card.tsx`)

- AI API 비용, 서버 비용 등 운영 비용 요약

---

## 2. AI 보유 분석 탭

**컴포넌트**: `ai-decisions-page.tsx`

### 2.1 필터 탭

| 필터 | 설명 |
|------|------|
| 전체 (all) | 모든 보유종목 |
| 홀드 (hold) | 보유 유지 권고 |
| 매수 (buy) | 추가 매수 권고 |
| 매도 (sell) | 매도 권고 |

### 2.2 정렬 옵션

| 정렬 키 | 설명 |
|---------|------|
| `score` | AI 매수 점수 (기본, 내림차순) |
| `profit_rate` | 수익률 |
| `current_price` | 현재가 |
| `company_name` | 종목명 (가나다순) |
| `sector` | 섹터 |

### 2.3 종목 카드 (아코디언)

각 종목에 대해:
- **헤더**: 종목명, AI 판정 배지 (매수/매도/홀드), 점수 (0~100), 현재가, 수익률
- **미니 캔들**: 당일 OHLC 기반 SVG 캔들차트
- **확장 시 상세**:
  - 전략 사유 (`decision_rationale`)
  - 현재 전략 (`current_strategy`)
  - 기술적 추세 (`technical_trend`)
  - 시장 영향 (`market_impact`)
  - 시간 요인 (`time_factor`)
  - 목표가 / 손절가

### 2.4 데이터 중복 제거

- 동일 티커의 여러 판정 중 최신 날짜/시간의 것만 표시
- `latestDecisions` useMemo로 최적화

---

## 3. 거래 내역 탭

**컴포넌트**: `trading-history-page.tsx`

### 3.1 성과 요약

- 총 거래 횟수, 승률, 평균 수익률, 평균 보유 기간
- 최고 수익 종목 / 최저 수익 종목 하이라이트

### 3.2 섹터별 성과

- `scenario.sector` 기반 섹터별 그룹화
- 각 섹터: 거래 횟수, 총 수익률, 평균 수익률

### 3.3 거래 목록

각 거래 항목:
- 종목명, 매수일/매도일, 보유 기간
- 매수가, 매도가, 수익률 (색상 구분)
- 매매 시나리오 상세 정보

---

## 4. 관심종목 탭

**컴포넌트**: `watchlist-page.tsx`

### 4.1 요약 통계

- 총 관심종목 수, 매수/관망/매도 수
- 신규 매수 종목 수 (`is_new_buy`)
- 평균 매수 점수

### 4.2 필터 탭

| 필터 | 설명 |
|------|------|
| 전체 (all) | 모든 관심종목 |
| 신규 매수 (new_buy) | `is_new_buy=true` 종목 |
| 매수 (buy) | 매수 권고 |
| 관망 (hold) | 관망 권고 |
| 매도 (sell) | 매도 권고 |

### 4.3 정렬 옵션

| 정렬 키 | 설명 |
|---------|------|
| `buy_score` | 매수 점수 (기본, 내림차순) |
| `upside` | 목표가 대비 상승여력(%) |
| `current_price` | 현재가 |
| `company_name` | 종목명 |
| `sector` | 섹터 |

### 4.4 종목 카드 (아코디언)

각 종목에 대해:
- **헤더**: 종목명, AI 판정 배지, 매수 점수 (0~100), 현재가
- **미니 캔들**: 당일 OHLC
- **목표가 대비 상승여력**: `(target_price - current_price) / current_price * 100`
- **확장 시 상세**:
  - 매수/관망/매도 사유 (`rationale`)
  - 포트폴리오 분석 (`portfolio_analysis`)
  - 섹터 전망 (`sector_outlook`)
  - 시장 환경 (`market_condition`)
  - 투자 기간 (`investment_period`: 단기/중기/장기)
  - 목표가 / 손절가
  - 분석 날짜 (`analyzed_date`)

### 4.5 퀀트 스크리닝

- pykrx에서 OHLCV 데이터 수집
- Claude AI가 각 종목에 대해 매수 적합성 0~100점 평가
- 목표가와 손절가를 AI가 설정
- 10종목씩 배치로 분석 실행

---

## 5. 인사이트 탭

**컴포넌트**: `trading-insights-page.tsx`

### 5.1 트리거 신뢰도 카드 (`trigger-reliability-card.tsx`)

- 매수 트리거 적중률 데이터 시각화
- 트리거 유형별 성공/실패 통계

### 5.2 트레이딩 원칙 (Principles)

- `TradingPrinciple` 타입 데이터
- 시장별 필터링 (KR/US/전체)
- 각 원칙: 제목, 설명, 카테고리, 생성일

### 5.3 트레이딩 저널 (Journal Entries)

- 매매 회고 및 학습 기록
- 시장 공통 (필터링하지 않음)
- 날짜별 저널 목록

### 5.4 트레이딩 직관 (Intuitions)

- AI가 감지한 시장 직관적 인사이트
- 시장별 필터링 가능

### 5.5 시장 필터

| 필터 | 설명 |
|------|------|
| 전체 (all) | 모든 시장 |
| KR | 한국 시장 |
| US | 미국 시장 |

---

## 6. 포트폴리오 탭

**컴포넌트**: `portfolio-page.tsx`

### 6.1 데이터 소스

- 서버: `portfolio_data.json` (기본 데이터)
- 로컬: `localStorage` (사용자 CRUD 편집 저장)
- 우선순위: 사용자 편집 데이터 > 서버 JSON

### 6.2 계좌별 뷰

- 탭으로 계좌 전환 (예: 한투 ISA, 한투 위탁 등)
- 각 계좌별 종목 테이블

### 6.3 종목 테이블

각 종목:
- 종목명 (네이버 차트 링크)
- 종목코드
- 보유 수량
- 평균 매수가
- 섹터 배지 (색상 매핑: 반도체=파랑, 방산=빨강, 에너지=주황 등)

### 6.4 CRUD 기능

- **추가**: 종목명, 코드, 수량, 평균가 입력 모달
- **수정**: 기존 종목 편집 모달
- **삭제**: 확인 다이얼로그 후 삭제

### 6.5 검색 및 정렬

- 종목명/코드 텍스트 필터링
- 정렬: 종목명, 코드, 수량, 평균가 (오름차순/내림차순)

### 6.6 섹터 색상 매핑

| 섹터 | 색상 |
|------|------|
| 반도체 | 파랑 |
| 자동차 | 슬레이트 |
| 에너지 | 주황 |
| 방산 | 빨강 |
| 인터넷 | 초록 |
| 전력 | 노랑 |
| 해외ETF | 보라 |
| 금현물/금ETF | 금색 |
| 채권ETF | 시안 |
| 로봇ETF | 핑크 |

---

## 7. 뉴스 탭

**컴포넌트**: `news-page.tsx`

### 7.1 데이터 소스

`news_data.json`에서 로드 (RSS 7개 + YouTube 7개 크롤링 결과)

**RSS 뉴스 소스**:
- 매일경제 (`mk.co.kr/rss/30100041/`)
- 한국경제 (`hankyung.com/feed/stock`)
- 한경글로벌마켓 (`hankyung.com/feed/globalmarket`)
- 연합뉴스 (`yna.co.kr/rss/economy.xml`)
- 조선비즈 (`biz.chosun.com/site/data/rss/rss.xml`)
- Investing.com 한국어 (`kr.investing.com/rss/news.rss`)
- Investing.com 글로벌 (`investing.com/rss/news_301.rss`)

**YouTube 채널**:
- 슈카월드, 삼프로TV, 올랜도캠퍼스, 소수몽키, 체슬리TV, 머니두, 박곰희TV

### 7.2 AI 스캔 애니메이션

- 뉴스 로딩 시 소스별 스캔 진행 상황 표시
- 펄스 애니메이션 + 소스명 순차 표시

### 7.3 키워드 워드클라우드

- Claude AI가 추출한 투자 키워드 30개
- 각 키워드:
  - **크기**: `count` (빈도) 기반 (1~100)
  - **카테고리 배지**: 섹터(보라) / 이슈(주황) / 종목(시안) / 경제(노랑)
  - **감정 분석**: 긍정(초록) / 부정(빨강) / 중립(파랑)
  - **관련어**: 관련 키워드 목록

### 7.4 뉴스 헤드라인 목록

- 중요도 내림차순 정렬 (`importance`)
- 유튜브 콘텐츠 우선 표시
- 각 헤드라인:
  - 제목 (클릭 시 원문 URL)
  - 출처 매체명
  - 게시 시각
  - 감정 분석 도트 (초록/빨강/파랑)
  - 매칭 키워드 배지

### 7.5 감정 분석 통계

- 긍정/부정/중립 키워드 비율 표시
- 전체 시장 심리 요약

---

## 8. 리포트 탭

**컴포넌트**: `reports-page.tsx`

### 8.1 매크로 리포트 (Investment Alpha)

| 리포트 | 파일 | 아이콘 |
|--------|------|--------|
| 거시경제 분석 | `macro_economy_report.html` | Landmark |
| 원자재 분석 | `commodity_report.html` | Gem |
| 주식시장 분석 | `stock_market_report.html` | CandlestickChart |
| 부동산 분석 | `real_estate_report.html` | MapPin |
| 종합 투자 분석 | `final_investment_report.html` | Crown |
| 매수 타이밍 전략 | `timing_strategy_report.html` | Clock |

### 8.2 특별 리포트

| 리포트 | 파일 |
|--------|------|
| 코스피 종합 분석 | `kospi_market_analysis_report.html` |
| 외국인 매도 분석 | `foreign_selling_analysis_report.html` |
| 유가 급등 영향 | `oil_surge_impact_report.html` |
| 전쟁 비교 분석 | `war_historical_comparison_report.html` |

### 8.3 리포트 뷰어

- 카드 클릭 시 `iframe`으로 인라인 표시
- "새 탭에서 열기" 버튼
- "뒤로가기" 버튼으로 리포트 목록 복귀
- 리포트 목록 인덱스 페이지 링크 (`/reports/index_reports.html`)

---

## 9. 헤더 티커바

**컴포넌트**: `market-ticker-bar.tsx`

### 9.1 표시 지수 (14개)

| 순서 | 지수 | 데이터 소스 |
|------|------|-----------|
| 1 | KOSPI | `realtime.kospi` (KIS API) |
| 2 | KOSDAQ | `realtime.kosdaq` (KIS API) |
| 3 | S&P 500 | `realtime.overseas.S&P 500` (SPY ETF x10) |
| 4 | NASDAQ | `realtime.overseas.NASDAQ` (QQQ ETF x37.8) |
| 5 | WTI | `realtime.overseas.WTI` (USO ETF x0.81) |
| 6 | Gold | `realtime.overseas.Gold` (GLD ETF x10.9) |
| 7 | Silver | `realtime.overseas.Silver` (SLV ETF x1.12) |
| 8 | USD/KRW | `realtime.overseas.USD/KRW` (pykrx KODEX 미국달러선물 ETF / 10) |
| 9 | VIX | fallback 값 (23.87) |
| 10 | US10Y | fallback 값 (4.31%) |
| 11 | US30Y | fallback 값 (4.68%) |
| 12 | Dow Jones | fallback 값 |
| 13 | SOX | fallback 값 |
| 14 | Bitcoin | `realtime.overseas.Bitcoin` 또는 fallback |

### 9.2 ETF -> 실제 지수 변환

KIS API는 ETF 가격을 반환하므로, 클라이언트에서 배수를 곱하여 실제 지수로 환산:

```typescript
const etfToReal = {
  "S&P 500": { multiplier: 10, prefix: "" },
  "NASDAQ":  { multiplier: 37.8, prefix: "" },
  "Gold":    { multiplier: 10.9, prefix: "$" },
  "WTI":     { multiplier: 0.81, prefix: "$" },
  "Silver":  { multiplier: 1.12, prefix: "$" },
  "USD/KRW": { multiplier: 1, prefix: "" },
}
```

### 9.3 애니메이션

- CSS `@keyframes ticker`: 30초 주기 좌측 스크롤
- hover 시 애니메이션 일시정지 (`animation-play-state: paused`)
- 데이터 갱신 시 스크롤 위치 유지 (`DOMMatrix` 기반 offset 저장/복원)

### 9.4 네이버 연동

- 각 지수 클릭 시 네이버 금융 해당 페이지로 새 탭 열기
- `NAVER_URLS` 맵에서 URL 매핑

### 9.5 갱신 주기

- 1분마다 `dashboard_data.json` fetch
- 데이터 해시 비교 후 변경된 경우에만 state 업데이트 (DOM 깜빡임 방지)

---

## 10. 네이버 차트 연동

**파일**: `lib/naver-chart.ts`

### 10.1 URL 생성 규칙

```typescript
function getNaverChartUrl(ticker: string): string | null {
  // 6자리 숫자 (일반 종목, ETF): finance.naver.com/item/fchart.naver?code={ticker}
  // 영문+숫자 혼합 코드 (예: 0036R0): 동일 패턴
  // 특수 티커 (GOLD 등): null
}
```

### 10.2 사용 위치

- `holdings-table.tsx`: 종목명 클릭 시 네이버 차트 새 탭 열기
- `ai-decisions-page.tsx`: 종목명 옆 차트 링크
- `watchlist-page.tsx`: 관심종목 차트 링크
- `portfolio-page.tsx`: 포트폴리오 종목 차트 링크
- `stock-detail-modal.tsx`: 종목 상세 모달 내 차트 링크

---

## 11. 미니 캔들 차트

**컴포넌트**: `mini-candle.tsx`

### 11.1 디자인

- SVG 기반 미니 캔들차트 (20px x 36px)
- 한국식 색상: 상승=빨강(`#ef4444`), 하락=파���(`#3b82f6`)
- glow 이펙트: `drop-shadow(0 0 3px)` 적용

### 11.2 구조

```
  위 꼬리 (line): 고가 ~ max(시가, 종가)
  몸통 (rect): max(시가, 종가) ~ min(시가, 종가)
  아래 꼬리 (line): min(시가, 종가) ~ 저가
```

- 최소 몸통 높이: 6px (시가=종가인 경우)
- 몸통 모서리 둥글기: `rx="2"`

### 11.3 Props

| Prop | 타입 | 설명 |
|------|------|------|
| `open` | number | 시가 |
| `close` | number | 종가 |
| `high` | number | 고가 |
| `low` | number | 저가 |

### 11.4 사용 위치

- `holdings-table.tsx`: 보유종목 현재가 옆
- `ai-decisions-page.tsx`: AI 분석 종목 옆
- `watchlist-page.tsx`: ���심종목 현재가 옆

---

## 12. 공통 기능

### 12.1 종목 상세 모달 (`stock-detail-modal.tsx`)

- 풀 스크린 오버레이 (백드롭 블러)
- 최대 너비 `max-w-4xl`, 최대 높이 `90vh` 스크롤
- 표시 내용:
  - 종목명, 현재가, 수익률
  - AI 전략 판정 (매수/매도/홀드)
  - 목표가, 손절가
  - 전략 사유, 시장 분석
  - 네이버 차트 링크

### 12.2 시장 선택 (`market-selector.tsx`)

- KR (한국주식) / US (미국주식) 토글 버튼
- 시장별 데이터 파일 분기:
  - KR: `dashboard_data.json` / `dashboard_data_en.json`
  - US: `us_dashboard_data.json` / `us_dashboard_data_en.json`
- US 시장에서는 리포트 탭(`jeoningu-lab`) 비활성화

### 12.3 다국어 지원 (`language-provider.tsx`)

- 한국어(ko) / 영어(en) 전환
- `t()` 함수로 번역 키 접근
- URL 파라미터나 브라우저 설정 기반 초기 언어 결정

### 12.4 테마 지원 (`theme-provider.tsx`)

- 다크모드 / 라이트모드 전환 (next-themes)
- 시스템 설정 기반 자동 감지

### 12.5 데이터 폴링

- `useEffect`에서 1분(60,000ms) 주기로 JSON fetch
- `generated_at` 해시 비교로 불필요한 리렌더링 방지
- 기존 포커스/스크롤 위치 유지

### 12.6 반응형 레이아웃

- 모바일: 가로 스크롤 네비게이션, 3열 그리드
- 태블릿: 축소된 카드 레이아웃
- 데스크톱: 최대 `1600px` 컨테이너, 6열 그리드

### 12.7 통화 포맷 (`lib/currency.ts`)

- KR 시장: `000,000원` (원화)
- US 시장: `$0,000.00` (달러)
- `formatCurrency(value, market, language)` 유틸리티 함수
