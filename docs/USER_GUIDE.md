# MarketPulse 사용자 가이드

> MarketPulse (MarketPulse) 설치, 실행, 자동화 가이드

---

## 1. 설치 가이드

### 1.1 Prerequisites

| 소프트웨어 | 최소 버전 | 용도 |
|-----------|----------|------|
| Python | 3.11+ | 파이프라인 런타임 |
| Node.js | 18+ | Next.js 대시보드 |
| pnpm 또는 npm | 최신 | 패키지 관리 |
| pandoc | 3.9+ | MD -> HTML 변환 |
| Claude Code CLI | 최신 | AI 분석 (`claude -p`) |
| Chrome | 최신 | PDF 변환 (headless 모드) |

### 1.2 Python 환경 설정

```bash
cd /Users/jacob119/dev/tools/prism-alpha

# 가상환경 생성 및 활성화
python3 -m venv .venv
source .venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

주요 Python 패키지:
- `pykrx`: KRX 주가 데이터
- `feedparser`: RSS 뉴스 파싱
- `PyYAML`: KIS API 설정 파싱
- `json-repair`: AI 응답 JSON 자동 복구
- `anthropic`, `openai`: LLM API SDK
- `python-telegram-bot`: 텔레그램 알림

### 1.3 Node.js 대시보드 설정

```bash
cd examples/dashboard

# 의존성 설치
npm install
# 또는
pnpm install
```

### 1.4 환경변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
# 텔레그램
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHANNEL_ID=your_channel_id

# Redis (선택)
UPSTASH_REDIS_URL=your_redis_url

# GCP Pub/Sub (선택)
GCP_PROJECT_ID=your_project_id

# Firebase (선택)
FIREBASE_CREDENTIALS_PATH=your_path
```

### 1.5 KIS API 설정

`trading/config/kis_devlp.yaml` 파일 설정:

```yaml
my_app: "YOUR_APP_KEY"
my_sec: "YOUR_APP_SECRET"
prod: "https://openapi.koreainvestment.com:9443"
```

- 한국투자증권 Open API 가입 필요: https://apiportal.koreainvestment.com
- 앱 키/시크릿 발급 후 YAML에 입력

---

## 2. 대시보드 실행 방법

### 2.1 개발 모드 (웹 + 실시간 서버 동시)

```bash
cd /Users/jacob119/dev/tools/prism-alpha/examples/dashboard
npm run dev
```

이 명령은 `concurrently`를 통해 두 프로세스를 동시에 실행합니다:
- **Next.js 개발 서버**: `http://localhost:3000`
- **실시간 데이터 서버**: `scripts/realtime.sh` (1분마다 시세, 5분마다 뉴스)

### 2.2 웹 서버만 실행 (데이터 갱신 없이)

```bash
cd /Users/jacob119/dev/tools/prism-alpha/examples/dashboard
npm run dev:web
```

### 2.3 프로덕션 빌드

```bash
cd /Users/jacob119/dev/tools/prism-alpha/examples/dashboard
npm run build
npm run start
```

프로덕션 모드에서도 `concurrently`로 실시간 서버가 함께 실행됩니다.

### 2.4 접속

- 브라우저에서 `http://localhost:3000` 열기
- 대시보드 데이터는 1분마다 자동 갱신
- 탭 전환: URL 파라미터로 직접 접근 가능 (예: `http://localhost:3000/?tab=watchlist`)

---

## 3. 일일 분석 실행 방법

### 3.1 전체 파이프라인 (매크로 + 종목 + 대시보드 갱신)

```bash
cd /Users/jacob119/dev/tools/prism-alpha
source .venv/bin/activate
./scripts/daily_run.sh all
```

Phase 1~5 순차 실행:
1. 데이터 검증 (`validate_data.py`)
2. 매크로 분석 (Investment Alpha 4인 전문가 병렬 + 종합 분석가)
3. 종목 분석 (포트폴리오에서 보유종목 자동 로드)
4. HTML 생성 (pandoc)
5. 아카이브 (날짜별 백업)
6. 대시보드 갱신 (실시간 시세, 뉴스, 보유+관심종목 분석)

### 3.2 매크로 분석만 실행

```bash
./scripts/daily_run.sh macro
```

Investment Alpha 전문가 4명이 병렬로 분석한 후, 종합 분석가가 통합 리포트를 생성합니다.

출력 파일:
- `reports/macro/macro_economy_report.md`
- `reports/macro/commodity_report.md`
- `reports/macro/stock_market_report.md`
- `reports/macro/real_estate_report.md`
- `reports/macro/final_investment_report.md`

### 3.3 종목 분석만 실행

```bash
./scripts/daily_run.sh stocks
```

또는 개별 종목 분석:

```bash
source .venv/bin/activate
python -m pipeline.stock_pipeline 000660 SK하이닉스
python -m pipeline.stock_pipeline 005930 삼성전자
```

출력 파일: `reports/stocks/000660_SK하이닉스_20260405.md`

### 3.4 Python 모듈 직접 실행

```bash
source .venv/bin/activate

# 전체 일일 파이프라인
python -m pipeline.daily_pipeline all

# 매크로만
python -m pipeline.daily_pipeline macro

# 종목만
python -m pipeline.daily_pipeline stocks
```

### 3.5 로그 확인

```bash
# 실행 로그
cat logs/pipeline_$(date +%Y-%m-%d).log
```

---

## 4. 실시간 서버 실행 방법

### 4.1 자동 (대시보드와 함께)

```bash
cd /Users/jacob119/dev/tools/prism-alpha/examples/dashboard
npm run dev
# concurrently가 realtime.sh를 자동 실행
```

### 4.2 수동 실행

```bash
cd /Users/jacob119/dev/tools/prism-alpha
source .venv/bin/activate
./scripts/realtime.sh
```

동작:
- 시작 시 뉴스 즉시 1회 갱신
- 1분마다 KIS API 실시간 시세 갱신 (`realtime_server.py once`)
- 5분마다 RSS + YouTube 뉴스 크롤링 (`news_crawler.py`)

### 4.3 시세만 1회 갱신

```bash
source .venv/bin/activate
python3 pipeline/realtime_server.py once
```

### 4.4 시세 지속 갱신 (커스텀 주기)

```bash
# 기본 60초 주기
python3 pipeline/realtime_server.py

# 30초 주기
python3 pipeline/realtime_server.py 30
```

---

## 5. 뉴스 크롤링 실행 방법

### 5.1 단독 실행

```bash
cd /Users/jacob119/dev/tools/prism-alpha
source .venv/bin/activate
python3 pipeline/news_crawler.py
```

수집 소스:
- RSS 뉴스 7개 피드 (매경/한경/연합/조선/Investing.com)
- YouTube 7개 채널 (슈카/삼프로/올랜도/소수몽키/체슬리/머니두/박곰희)

처리 과정:
1. RSS + YouTube 피드 파싱 (feedparser)
2. Claude Code CLI로 AI 키워드 추출 + 감정 분석 + 중요도 평가
3. `examples/dashboard/public/news_data.json`에 저장

### 5.2 셸 스크립트로 실행

```bash
./scripts/news_update.sh
```

### 5.3 출력 형식

```json
{
  "generated_at": "2026-04-05T14:30:00",
  "keywords": [
    {"word": "반도체", "count": 85, "category": "섹터", "sentiment": "긍정", "related": ["HBM", "AI"]}
  ],
  "headlines": [
    {"title": "...", "source": "매일경제", "time": "2시간 전", "sentiment": "긍정", "importance": 9, "url": "..."}
  ]
}
```

---

## 6. 포트폴리오 데이터 업데이트 방법

### 6.1 JSON 파일 직접 편집

포트폴리오 데이터 파일: `examples/dashboard/public/portfolio_data.json`

```json
{
  "accounts": [
    {
      "name": "한투 ISA",
      "type": "ISA",
      "stocks": [
        {
          "name": "SK하이닉스",
          "code": "000660",
          "quantity": 10,
          "avg_price": 185000,
          "sector": "반도체"
        }
      ]
    }
  ]
}
```

### 6.2 대시보드에서 편집

포트폴리오 탭 (`http://localhost:3000/?tab=portfolio`)에서:
- **종목 추가**: "+" 버튼 클릭 -> 종목명, 코드, 수량, 평균가 입력
- **종목 수정**: 연필 아이콘 클릭 -> 정보 수정
- **종목 삭제**: 휴지통 아이콘 클릭 -> 확인

편집 데이터는 `localStorage`에 저장됩니다.

### 6.3 시세 자동 반영

`realtime_server.py`가 `portfolio_data.json`의 종목 코드를 읽어 KIS API로 현재가를 조회하고, `dashboard_data.json`에 반영합니다.

---

## 7. 관심종목 추가/수정 방법

### 7.1 대시보드 데이터에서 직접 편집

`examples/dashboard/public/dashboard_data.json`의 `watchlist` 배열에 추가:

```json
{
  "watchlist": [
    {
      "id": "000660",
      "ticker": "000660",
      "name": "SK하이닉스",
      "company_name": "SK하이닉스",
      "current_price": 185000,
      "change": 3000,
      "change_rate": 1.65,
      "sector": "반도체",
      "buy_score": 75,
      "decision": "매수",
      "target_price": 250000,
      "stop_loss": 160000,
      "analyzed_date": "2026-04-05"
    }
  ]
}
```

### 7.2 AI 분석 자동 갱신

`watchlist_analyzer.py`가 관심종목을 자동으로 분석합니다:
1. `dashboard_data.json`에서 watchlist 로드
2. pykrx로 각 종목 현재가 + OHLCV 조회
3. Claude AI가 10종목씩 배치로 매수 적합성 평가
4. buy_score, decision, target_price, stop_loss 업데이트

```bash
source .venv/bin/activate
python -m pipeline.watchlist_analyzer
```

---

## 8. crontab / pmset 자동화 설정

### 8.1 crontab 설정

```bash
crontab -e
```

추가할 내용:

```crontab
# 평일 일일 파이프라인 (check_market_day.py로 휴장일 제외)
50 8 * * 1-5 cd /Users/jacob119/dev/tools/prism-alpha && source .venv/bin/activate && python check_market_day.py && ./scripts/daily_run.sh all >> logs/cron_$(date +\%Y-\%m-\%d).log 2>&1

# 뉴스 크롤링 (매시간)
0 * * * 1-5 cd /Users/jacob119/dev/tools/prism-alpha && source .venv/bin/activate && python3 pipeline/news_crawler.py >> logs/news_$(date +\%Y-\%m-\%d).log 2>&1
```

### 8.2 pmset 자동 기상 (macOS)

시장 개장 전에 맥을 자동으로 깨우도록 설정:

```bash
# 평일 08:45에 자동 기상
sudo pmset repeat wakeorpoweron MTWRF 08:45:00
```

확인:
```bash
pmset -g sched
```

해제:
```bash
sudo pmset repeat cancel
```

---

## 9. E2E 테스트 실행 방법

### 9.1 Playwright 설치

```bash
cd /Users/jacob119/dev/tools/prism-alpha/examples/dashboard
npx playwright install
```

### 9.2 테스트 실행

먼저 대시보드 서버가 실행 중이어야 합니다:

```bash
# 터미널 1: 대시보드 서버
npm run dev:web

# 터미널 2: 테스트 실행
npx playwright test
```

### 9.3 테스트 항목

`e2e/dashboard.spec.ts`에 정의된 테스트:

| 테스트 | 검증 내용 |
|--------|----------|
| Dashboard 로드 + 에러 + 성능 | 10초 이내 로드, 콘솔 에러 없음 |
| AI Decisions 로드 + 에러 + 성능 | 10초 이내 로드 |
| Trading 로드 + 에러 + 성능 | 10초 이내 로드 |
| Watchlist 로드 + 에러 + 성능 | 10초 이내 로드 |
| Insights 로드 + 에러 + 성능 | 10초 이내 로드 |
| 데이터 구조 + 타입 + 값 범위 | JSON 필수 키 존재, 필드 타입 검증, 값 범위 검증 |

### 9.4 Playwright 설정

`playwright.config.ts`:
- **테스트 디렉토리**: `./e2e`
- **타임아웃**: 30초
- **baseURL**: `http://localhost:3000`
- **headless**: true
- **스크린샷**: 실패 시에만 캡처

### 9.5 테스트 스크린샷 확인

```bash
ls examples/dashboard/e2e/screenshots/
```

사용 가능한 스크린샷:
- `dashboard.png` - 메인 대시보드
- `ai-decisions.png`, `ai-decisions-expanded.png`, `ai-decisions-new.png` - AI 분석
- `watchlist.png`, `watchlist-expanded.png`, `watchlist-new.png` - 관심종목
- `insights.png` - 인사이트
- `portfolio-pie.png`, `portfolio-sector.png` - 포트폴리오
- `mobile-dashboard.png`, `tablet-dashboard.png` - 반응형

---

## 10. 트러블슈팅 (FAQ)

### Q1: KIS API 토큰 발급 실패

```
KIS 토큰 신규 발급 실패: ...
```

**해결**:
1. `trading/config/kis_devlp.yaml`의 `my_app`과 `my_sec` 확인
2. 한투 Open API 포털에서 앱 키 활성화 상태 확인
3. 캐싱된 토큰 삭제: `rm .kis_token.json`

### Q2: pykrx 데이터 조회 실패

```
[데이터] OHLCV 조회 실패
```

**해결**:
1. 네트워크 연결 확인
2. 장 마감 후 데이터 업데이트에 시간 소요 (보통 17시 이후 안정)
3. 휴장일에는 데이터가 없음 (check_market_day.py로 확인)

### Q3: Claude Code CLI 호출 실패

```
claude CLI를 찾을 수 없습니다
```

**해결**:
1. Claude Code CLI 설치 확인: `which claude` 또는 `ls ~/.local/bin/claude`
2. PATH에 추가: `export PATH="$HOME/.local/bin:$PATH"`
3. Max 구독 활성 상태 확인

### Q4: 대시보드 빈 화면

**해결**:
1. JSON 데이터 존재 확인: `ls examples/dashboard/public/dashboard_data.json`
2. JSON 유효성 검증: `python3 -m json.tool examples/dashboard/public/dashboard_data.json`
3. 데이터 검증 스크립트: `python3 scripts/validate_data.py`
4. 초기 데이터 생성: `python3 scripts/generate_dashboard_data.py`

### Q5: 뉴스 크롤링 AI 분석 실패 (폴백 모드)

```
[뉴스] AI 분석 실패 (폴백 모드)
```

**해결**:
- Claude Code CLI가 정상 동작하는지 확인: `claude -p "hello" --output-format text`
- 폴백 모드에서는 단순 단어 빈도 기반 키워드 추출이 동작하므로 서비스에는 영향 없음

### Q6: 데이터 검증 실패

```
[FAIL] 데이터 검증 실패 (N건)
```

**해결**:
1. 검증 스크립트 실행: `python3 scripts/validate_data.py`
2. 에러 메시지에 따라 `dashboard_data.json` 또는 `portfolio_data.json` 수정
3. 주요 검증 항목:
   - `current_price > 0` (현재가)
   - `sector` 필드 존재
   - 종목 코드 6자리 숫자 형식
   - holdings와 watchlist 중복 없음

### Q7: pandoc HTML 변환 실패

```
HTML 변환 실패
```

**해결**:
1. pandoc 설치 확인: `pandoc --version`
2. 설치: `brew install pandoc` (macOS)
3. 리포트 디렉토리 확인: `ls reports/macro/*.md`

### Q8: 실시간 서버가 종료됨

**해결**:
- `realtime.sh`는 무한 루프이므로 터미널이 닫히면 종료됨
- `tmux`나 `screen` 세션에서 실행 권장:
  ```bash
  tmux new -s realtime
  ./scripts/realtime.sh
  # Ctrl+B, D로 detach
  ```
- 또는 `nohup` 사용:
  ```bash
  nohup ./scripts/realtime.sh > logs/realtime.log 2>&1 &
  ```

### Q9: US 시장 데이터가 없음

```
미국 시장 데이터가 아직 없습니다.
```

**해결**:
- US 대시보드 데이터 생성: `python3 examples/generate_us_dashboard_json.py`
- US 데이터 파일: `examples/dashboard/public/us_dashboard_data.json`

### Q10: 포트폴리오 편집 데이터 초기화

대시보드에서 편집한 포트폴리오 데이터가 사라진 경우:

**해결**:
- 편집 데이터는 `localStorage`에 저장됨
- 브라우저 캐시 삭제 시 사라질 수 있음
- 영구 저장이 필요하면 `portfolio_data.json`을 직접 편집

---

## 11. 스크린샷

### 대시보드 스크린샷 (e2e/screenshots/)

| 스크린샷 | 설명 |
|---------|------|
| `e2e/screenshots/dashboard.png` | 메인 대시보드 전체 |
| `e2e/screenshots/ai-decisions.png` | AI 보유 분석 |
| `e2e/screenshots/ai-decisions-expanded.png` | AI 분석 상세 펼침 |
| `e2e/screenshots/ai-decisions-new.png` | AI 분석 최신 디자인 |
| `e2e/screenshots/watchlist.png` | 관심종목 |
| `e2e/screenshots/watchlist-expanded.png` | 관심종목 상세 |
| `e2e/screenshots/watchlist-new.png` | 관심종목 최신 디자인 |
| `e2e/screenshots/watchlist-new-badge.png` | 신규 매수 배지 |
| `e2e/screenshots/insights.png` | 인사이트 |
| `e2e/screenshots/portfolio-pie.png` | 포트폴리오 파이차트 |
| `e2e/screenshots/portfolio-sector.png` | 포트폴리오 섹터별 |
| `e2e/screenshots/mobile-dashboard.png` | 모바일 뷰 |
| `e2e/screenshots/tablet-dashboard.png` | 태블릿 뷰 |

### 홍보용 스크린샷 (public/screenshots/)

| 스크린샷 | 설명 |
|---------|------|
| `public/screenshots/dashboard_screenshot.png` | 대시보드 홍보 이미지 |
| `public/screenshots/analysis_report_screenshot.png` | 분석 리포트 |
| `public/screenshots/auto_trading_screenshot.jpeg` | 자동 매매 |
| `public/screenshots/telegram_alert_screenshot.png` | 텔레그램 알림 |

모든 스크린샷 경로는 `examples/dashboard/` 기준 상대 경로입니다.
