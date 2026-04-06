#!/bin/bash
# ================================================================
# MarketPulse Harness Pipeline
# Anthropic Harness Design Pattern 적용
# 3단계: Planner → Generator(2병렬) → Evaluator → Deploy
# ================================================================

WORK_DIR="/Users/jacob119/dev/tools/prism-alpha"
LOG_DIR="${WORK_DIR}/logs"
LOG_FILE="${LOG_DIR}/harness_$(date +%Y-%m-%d).log"
CLAUDE="${HOME}/.local/bin/claude"
REPORTS_DIR="${WORK_DIR}/reports/macro"
DASHBOARD_DIR="${WORK_DIR}/examples/dashboard/public/reports/macro"
DATE=$(date +%Y-%m-%d)
DATETIME=$(date '+%Y-%m-%d %H:%M:%S KST')

mkdir -p "${LOG_DIR}" "${REPORTS_DIR}" "${DASHBOARD_DIR}"

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "${LOG_FILE}"; }

log "=========================================="
log "MarketPulse Harness Pipeline 시작"
log "날짜: ${DATETIME}"
log "=========================================="

# ================================================================
# Phase 1: PLANNER (solution-architect)
# 오늘 시장 상황 파악 → 분석 사양 + 스프린트 계약
# ================================================================
log ""
log "=== Phase 1: PLANNER ==="

SPRINT_CONTRACT="${WORK_DIR}/reports/sprint_contract_${DATE}.md"

"${CLAUDE}" -p "당신은 MarketPulse 솔루션 아키텍트입니다. 오늘 ${DATE} 기준으로:

1. WebSearch로 오늘의 핵심 시장 이벤트 3개를 파악
2. 12개 리포트의 분석 사양(각 리포트가 반드시 다뤄야 할 핵심 포인트)을 작성
3. 평가 기준(스프린트 계약)을 정의:
   - 데이터 정확성: 가격/지수가 실제와 일치하는가
   - 일관성: 12개 리포트 간 결론이 모순 없는가
   - 완성도: 3000자 이상, 근거 있는 분석인가
   - 시의성: 오늘 날짜 데이터가 반영되었는가

마크다운으로 작성해줘." \
  --allowedTools "WebSearch,WebFetch" \
  --output-format text > "${SPRINT_CONTRACT}" 2>> "${LOG_FILE}"

log "스프린트 계약 생성 완료: $(wc -c < "${SPRINT_CONTRACT}") bytes"

# ================================================================
# Phase 2: GENERATOR (에이전트 A + B 병렬)
# 각각 6개 리포트 작성
# ================================================================
log ""
log "=== Phase 2: GENERATOR (병렬) ==="

# Agent A: 거시경제 + 원자재 + 주식 + 부동산 + 코스피 + 외국인
"${CLAUDE}" -p "Investment Alpha 에이전트 A — 오늘 ${DATETIME} 기준 6개 리포트 작성.

스프린트 계약:
$(cat "${SPRINT_CONTRACT}" 2>/dev/null | head -100)

1. 거시경제 분석 → ${REPORTS_DIR}/macro_economy_report.md
2. 원자재 분석 → ${REPORTS_DIR}/commodity_report.md
3. 주식시장 분석 → ${REPORTS_DIR}/stock_market_report.md
4. 부동산 분석 → ${REPORTS_DIR}/real_estate_report.md
5. 코스피 종합 → ${REPORTS_DIR}/kospi_market_analysis_report.md
6. 외국인 매도 → ${REPORTS_DIR}/foreign_selling_analysis_report.md

각 리포트: 한국어, 3000자+, 작성일시 기입, WebSearch+Investing.com 교차검증." \
  --allowedTools "WebSearch,WebFetch,Read,Write" \
  --output-format text >> "${LOG_FILE}" 2>&1 &
PID_A=$!

# Agent B: 유가 + 전쟁비교 + 종합 + 타이밍 + 포트폴리오 + 월별
"${CLAUDE}" -p "Investment Alpha 에이전트 B — 오늘 ${DATETIME} 기준 6개 리포트 작성.

스프린트 계약:
$(cat "${SPRINT_CONTRACT}" 2>/dev/null | head -100)

1. 유가 급등 영향 → ${REPORTS_DIR}/oil_surge_impact_report.md
2. 전쟁 비교 분석 → ${REPORTS_DIR}/war_historical_comparison_report.md
3. 종합 투자 분석 → ${REPORTS_DIR}/final_investment_report.md
4. 매수 타이밍 전략 → ${REPORTS_DIR}/timing_strategy_report.md
5. 포트폴리오 분석 → ${REPORTS_DIR}/portfolio_analysis_report.md
6. 월별 종합 → ${REPORTS_DIR}/monthly_report_2026-04.md

각 리포트: 한국어, 3000자+, 작성일시 기입, WebSearch+Investing.com 교차검증." \
  --allowedTools "WebSearch,WebFetch,Read,Write" \
  --output-format text >> "${LOG_FILE}" 2>&1 &
PID_B=$!

log "에이전트 A (PID: ${PID_A}) + B (PID: ${PID_B}) 병렬 실행 중..."
wait ${PID_A}
log "에이전트 A 완료 (exit: $?)"
wait ${PID_B}
log "에이전트 B 완료 (exit: $?)"

# 리포트 생성 확인
REPORT_COUNT=$(ls "${REPORTS_DIR}"/*.md 2>/dev/null | wc -l | tr -d ' ')
log "생성된 리포트: ${REPORT_COUNT}개"

# ================================================================
# Phase 3: EVALUATOR (qa-engineer)
# 12개 리포트 교차검증
# ================================================================
log ""
log "=== Phase 3: EVALUATOR ==="

EVAL_RESULT="${WORK_DIR}/reports/evaluation_${DATE}.md"

"${CLAUDE}" -p "당신은 MarketPulse QA 엔지니어입니다. 다음 12개 리포트를 평가해줘.

리포트 디렉토리: ${REPORTS_DIR}/

스프린트 계약 기준:
$(cat "${SPRINT_CONTRACT}" 2>/dev/null | head -50)

평가 항목:
1. 데이터 정확성 — 가격/지수가 WebSearch 결과와 일치하는가?
2. 일관성 — 12개 리포트 간 결론이 모순 없는가?
3. 완성도 — 각 리포트 3000자 이상인가?
4. 시의성 — 오늘 ${DATE} 날짜 데이터가 반영되었는가?

각 리포트별 PASS/FAIL + 이유를 작성하고,
전체 종합 평가(PASS/FAIL)를 내려줘.

마크다운으로 ${EVAL_RESULT}에 저장해줘." \
  --allowedTools "WebSearch,Read,Write,Glob,Grep" \
  --output-format text >> "${LOG_FILE}" 2>&1

log "평가 완료: $(wc -c < "${EVAL_RESULT}" 2>/dev/null || echo 0) bytes"

# ================================================================
# Phase 4: DEPLOY (devops-engineer)
# HTML 생성 + 아카이브 + 대시보드 복사
# ================================================================
log ""
log "=== Phase 4: DEPLOY ==="

# HTML 생성 (pandoc)
CSS_FILE="${WORK_DIR}/examples/dashboard/public/reports/report-style.css"
HTML_COUNT=0
for md_file in "${REPORTS_DIR}"/*.md; do
  [ -f "$md_file" ] || continue
  html_file="${md_file%.md}.html"
  if command -v pandoc &>/dev/null; then
    pandoc "$md_file" -o "$html_file" --standalone \
      --metadata title="$(basename "$md_file" .md)" \
      --css="${CSS_FILE}" 2>/dev/null && HTML_COUNT=$((HTML_COUNT + 1))
  fi
done
log "HTML 생성: ${HTML_COUNT}개"

# 대시보드 public 복사
cp "${REPORTS_DIR}"/*.html "${DASHBOARD_DIR}/" 2>/dev/null
log "대시보드 복사 완료"

# 아카이브
ARCHIVE_DIR="${WORK_DIR}/reports/archive/${DATE}"
mkdir -p "${ARCHIVE_DIR}"
cp "${REPORTS_DIR}"/*.md "${ARCHIVE_DIR}/" 2>/dev/null
cp "${REPORTS_DIR}"/*.html "${ARCHIVE_DIR}/" 2>/dev/null
cp "${SPRINT_CONTRACT}" "${ARCHIVE_DIR}/" 2>/dev/null
cp "${EVAL_RESULT}" "${ARCHIVE_DIR}/" 2>/dev/null
log "아카이브 저장: ${ARCHIVE_DIR}"

# ================================================================
# 완료
# ================================================================
log ""
log "=========================================="
log "Harness Pipeline 완료"
log "  리포트: ${REPORT_COUNT}개"
log "  HTML: ${HTML_COUNT}개"
log "  아카이브: ${ARCHIVE_DIR}"
log "  평가: ${EVAL_RESULT}"
log "=========================================="
