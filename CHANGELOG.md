# Changelog

All notable changes to MarketPulse will be documented in this file.

Format: [Semantic Versioning](https://semver.org/) — MAJOR.MINOR.PATCH

---

## [1.0.0] - 2026-04-05

### Added
- Investment Alpha 6인 에이전트 + MarketPulse 13 에이전트 통합
- Claude Code CLI 기반 분석 체계 (Anthropic API 제거)
- Next.js 대시보드 8개 탭 (대시보드, AI 보유분석, 거래내역, 관심종목, 인사이트, 포트폴리오, 뉴스, 리포트)
- 실시간 시세 서버 (KIS REST API, 1분 갱신)
- 실시간 뉴스 크롤링 (RSS 7개 + YouTube 7채널, 5분 갱신)
- 워드클라우드 뉴스 시각화 (감정 분석, 키워드 추출)
- 포트폴리오 관리 (섹터 파이차트, 검색/정렬, CRUD)
- AI 보유 분석 테이블 (20종목, 아코디언 상세)
- 관심종목 퀀트 스크리닝 (30종목, 신규 매수 추천 12종목)
- 네이버 금융 차트 연동 (모든 티커 클릭)
- 헤더 티커바 (14개 주요 지수, 네이버 링크)
- 미니 캔들 컴포넌트 (현재가 옆 시각화)
- 인베스팅닷컴 4월 대장주 관심종목 반영
- E2E 테스트 25개 (Playwright)
- 데이터 검증 스크립트 (validate_data.py)
- PostToolUse hook (Edit/Write 후 빌드 체크)
- CLAUDE.md 프로젝트 문서화
- crontab 자동 실행 (평일 21:00) + pmset 자동 기상 (20:55)
- GitHub 레포 (jacob119/market-pulse)

### Changed
- Anthropic Claude API → Claude Code CLI 전환 (cores/llm_client.py)
- 뉴스 갱신 주기: 1시간 → 5분
- 포트폴리오 캐시: localStorage 우선 → 서버 JSON 우선

### Deprecated
- cores/report_generation.py (mcp-agent 의존)
- cores/company_name_translator.py (mcp-agent 의존)
- cores/agents/telegram_translator_agent.py (mcp-agent 의존)

### Fixed
- GST 티커 083310 → 083450 수정
- NaN/undefined/null 렌더링 방지 (12개 컴포넌트)
- React key prop 에러 수정 (watchlist, ai-decisions)
- 네이버 금융 URL @ 인코딩 수정 (%40)
- 포트폴리오 localStorage 캐시 문제 해결
- 헤더 티커바 데이터 갱신 시 스크롤 초기화 방지
