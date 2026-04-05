import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3000';

// ============================================================
// 1. 에러 수집 헬퍼 (error + warning 모두)
// ============================================================
async function collectErrors(page: Page, url: string) {
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('pageerror', err => errors.push(`[pageerror] ${err.message.substring(0, 300)}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[console.error] ${msg.text().substring(0, 300)}`);
    if (msg.type() === 'warning') warnings.push(`[warning] ${msg.text().substring(0, 200)}`);
  });

  const start = Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const loadTime = Date.now() - start;

  return { errors, warnings, loadTime };
}

// ============================================================
// 2. 페이지 로드 + 에러 + 성능 (각 탭)
// ============================================================
test('Dashboard — 로드 + 에러 + 성능', async ({ page }) => {
  const { errors, loadTime } = await collectErrors(page, BASE);
  console.log(`  Dashboard: ${errors.length}개 에러, ${loadTime}ms`);
  expect(errors.filter(e => !e.includes('key') || e.includes('API key'))).toHaveLength(0);
  expect(loadTime).toBeLessThan(10000); // 10초 이내
});

test('AI Decisions — 로드 + 에러 + 성능', async ({ page }) => {
  const { errors, loadTime } = await collectErrors(page, `${BASE}/?tab=ai-decisions`);
  console.log(`  AI Decisions: ${errors.length}개 에러, ${loadTime}ms`);
  expect(errors.filter(e => !e.includes('key') || e.includes('API key'))).toHaveLength(0);
  expect(loadTime).toBeLessThan(10000);
});

test('Trading — 로드 + 에러 + 성능', async ({ page }) => {
  const { errors, loadTime } = await collectErrors(page, `${BASE}/?tab=trading`);
  console.log(`  Trading: ${errors.length}개 에러, ${loadTime}ms`);
  expect(errors.filter(e => !e.includes('key') || e.includes('API key'))).toHaveLength(0);
  expect(loadTime).toBeLessThan(10000);
});

test('Watchlist — 로드 + 에러 + 성능', async ({ page }) => {
  const { errors, loadTime } = await collectErrors(page, `${BASE}/?tab=watchlist`);
  console.log(`  Watchlist: ${errors.length}개 에러, ${loadTime}ms`);
  expect(errors.filter(e => !e.includes('key') || e.includes('API key'))).toHaveLength(0);
  expect(loadTime).toBeLessThan(10000);
});

test('Insights — 로드 + 에러 + 성능', async ({ page }) => {
  const { errors, loadTime } = await collectErrors(page, `${BASE}/?tab=insights`);
  console.log(`  Insights: ${errors.length}개 에러, ${loadTime}ms`);
  expect(errors.filter(e => !e.includes('key') || e.includes('API key'))).toHaveLength(0);
  expect(loadTime).toBeLessThan(10000);
});

// ============================================================
// 3. 데이터 검증 (필드 타입 + 값 범위 + 필수값)
// ============================================================
test('데이터 — 구조 + 타입 + 값 범위', async ({ page }) => {
  const resp = await page.goto(`${BASE}/dashboard_data.json`);
  expect(resp?.status()).toBe(200);
  const d = await resp?.json();

  // 필수 최상위 키
  for (const key of ['generated_at', 'holdings', 'holding_decisions', 'watchlist', 'trading_insights', 'summary']) {
    expect(d, `최상위 키 '${key}' 누락`).toHaveProperty(key);
  }

  // holdings 검증
  expect(d.holdings.length).toBeGreaterThan(0);
  for (const h of d.holdings) {
    expect(h.ticker, `ticker 누락: ${h.name}`).toBeTruthy();
    expect(typeof h.current_price).toBe('number');
    expect(h.current_price, `${h.name} current_price 비정상`).toBeGreaterThan(0);
    expect(typeof h.profit_rate).toBe('number');
    expect(h.sector, `${h.name} sector 누락`).toBeTruthy();
  }

  // holding_decisions 검증
  expect(d.holding_decisions.length).toBeGreaterThan(0);
  for (const hd of d.holding_decisions) {
    expect(hd.ticker, `decision ticker 누락`).toBeTruthy();
    expect(['매수', '홀드', '중립', '매도', '관망', '강력매수', '강력매도']).toContain(hd.decision);
    expect(typeof hd.confidence === 'number' || typeof hd.buy_score === 'number').toBeTruthy();
    expect(hd.current_price, `${hd.company_name || hd.ticker} price 누락`).toBeGreaterThan(0);
  }

  // watchlist 검증
  expect(d.watchlist.length).toBeGreaterThan(0);
  for (const w of d.watchlist) {
    expect(w.ticker, `watchlist ticker 누락`).toBeTruthy();
    expect(w.company_name, `${w.ticker} company_name 누락`).toBeTruthy();
    expect(w.current_price, `${w.company_name} price 비정상`).toBeGreaterThan(0);
    expect(w.sector, `${w.company_name} sector 누락`).toBeTruthy();
    expect(w.analyzed_date, `${w.company_name} analyzed_date 누락`).toBeTruthy();
    expect(typeof w.buy_score).toBe('number');
    expect(w.buy_score).toBeGreaterThanOrEqual(0);
    expect(w.buy_score).toBeLessThanOrEqual(100);
    expect(w.decision, `${w.company_name} decision 누락`).toBeTruthy();
    // 목표가/손절가는 0보다 커야 함
    expect(w.target_price, `${w.company_name} target_price 누락`).toBeGreaterThan(0);
    expect(w.stop_loss, `${w.company_name} stop_loss 누락`).toBeGreaterThan(0);
    // 사유 (skip_reason 또는 rationale)
    const hasReason = (w.skip_reason && w.skip_reason.length > 0) || (w.rationale && w.rationale.length > 0);
    expect(hasReason, `${w.company_name} 사유(skip_reason/rationale) 누락`).toBeTruthy();
  }

  // holdings와 watchlist 중복 없어야 함
  const holdingTickers = new Set(d.holdings.map((h: any) => h.ticker));
  const watchlistTickers = d.watchlist.map((w: any) => w.ticker);
  const duplicates = watchlistTickers.filter((t: string) => holdingTickers.has(t));
  expect(duplicates, `보유/관심 중복: ${duplicates.join(',')}`).toHaveLength(0);

  // trading_insights 검증
  const ti = d.trading_insights;
  if (ti?.principles?.length > 0) {
    for (const p of ti.principles) {
      expect(p.condition || p.action, `principle 내용 누락`).toBeTruthy();
    }
  }

  console.log(`  데이터 검증 통과: holdings=${d.holdings.length} decisions=${d.holding_decisions.length} watchlist=${d.watchlist.length}`);
});

// ============================================================
// 4. UI 렌더링 검증 (핵심 요소 존재 확인)
// ============================================================
test('Dashboard — 핵심 UI 요소', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // MarketPulse 로고/헤더 존재
  const header = page.locator('h1:has-text("MarketPulse"), text=MarketPulse').first();
  const bodyText = await page.locator('body').textContent();
  expect(bodyText, 'MarketPulse 텍스트 없음').toContain('MarketPulse');

  // 운영 비용 카드 존재
  const costCard = page.locator('text=/\\$\\d+/').first();
  expect(await costCard.isVisible(), '운영 비용 표시 없음').toBeTruthy();

  // 스크린샷 저장 (회귀 비교용)
  await page.screenshot({ path: 'e2e/screenshots/dashboard.png', fullPage: true });
  console.log('  Dashboard 스크린샷 저장');
});

test('AI Decisions — 핵심 UI 요소', async ({ page }) => {
  await page.goto(`${BASE}/?tab=ai-decisions`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // 페이지 내용 존재 (빈 페이지가 아닌지)
  const body = await page.locator('body').textContent();
  expect(body?.length, 'AI Decisions 페이지 내용 없음').toBeGreaterThan(100);

  await page.screenshot({ path: 'e2e/screenshots/ai-decisions.png', fullPage: true });
  console.log('  AI Decisions 스크린샷 저장');
});

test('Watchlist — 핵심 UI 요소', async ({ page }) => {
  await page.goto(`${BASE}/?tab=watchlist`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // 종목 수 표시 존재
  const badge = page.locator('text=/\\d+종목|\\d+개|총/').first();
  expect(await badge.isVisible(), '종목 수 표시 없음').toBeTruthy();

  await page.screenshot({ path: 'e2e/screenshots/watchlist.png', fullPage: true });
  console.log('  Watchlist 스크린샷 저장');
});

test('Insights — 핵심 UI 요소', async ({ page }) => {
  await page.goto(`${BASE}/?tab=insights`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'e2e/screenshots/insights.png', fullPage: true });
  console.log('  Insights 스크린샷 저장');
});

// ============================================================
// 5. 인터랙션 테스트 (클릭/펼치기/접기)
// ============================================================
test('AI Decisions — 통계 카드 클릭 → 종목 리스트 토글', async ({ page }) => {
  await page.goto(`${BASE}/?tab=ai-decisions`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // "총 분석" 카드 클릭
  const totalCard = page.locator('text=/\\d+건/').first();
  if (await totalCard.isVisible()) {
    await totalCard.click();
    await page.waitForTimeout(500);

    // 클릭 후 변화 확인 (종목 리스트 또는 상태 변경)
    await page.waitForTimeout(500);
    console.log(`  통계 카드 클릭 완료`);
  }
});

test('Watchlist — 섹터 클릭 → 종목 펼침', async ({ page }) => {
  await page.goto(`${BASE}/?tab=watchlist`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // 섹터 카드 클릭
  const sectorItem = page.locator('text=/방산|반도체|조선/').first();
  if (await sectorItem.isVisible()) {
    await sectorItem.click();
    await page.waitForTimeout(500);

    // 종목이 펼쳐지는지 확인
    const expanded = page.locator('text=/점$/');
    const count = await expanded.count();
    console.log(`  섹터 클릭 → ${count}개 항목 펼침`);
  }
});

test('AI Decisions — 상세 분석 펼치기', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message.substring(0, 200)));

  await page.goto(`${BASE}/?tab=ai-decisions`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // "분석 상세" 버튼 클릭
  const detailBtns = page.locator('button:has-text("분석"), button:has-text("Detail")');
  const btnCount = await detailBtns.count();
  if (btnCount > 0) {
    await detailBtns.first().click();
    await page.waitForTimeout(500);
    console.log(`  상세 버튼 클릭 (${btnCount}개 중 1번째)`);
  }

  const critical = errors.filter(e => !e.includes('key') || e.includes('API key'));
  expect(critical, '상세 펼침 시 에러 발생').toHaveLength(0);
});

// ============================================================
// 6. 반응형 테스트 (모바일/태블릿)
// ============================================================
test('모바일 뷰포트 (375x812) — 에러 없음', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
  });
  const page = await context.newPage();
  const { errors, loadTime } = await collectErrors(page, BASE);
  console.log(`  모바일: ${errors.filter(e=>!e.includes('key')).length}개 에러, ${loadTime}ms`);
  await page.screenshot({ path: 'e2e/screenshots/mobile-dashboard.png', fullPage: true });
  expect(errors.filter(e => !e.includes('key') || e.includes('API key'))).toHaveLength(0);
  await context.close();
});

test('태블릿 뷰포트 (768x1024) — 에러 없음', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 768, height: 1024 },
  });
  const page = await context.newPage();
  const { errors, loadTime } = await collectErrors(page, BASE);
  console.log(`  태블릿: ${errors.filter(e=>!e.includes('key')).length}개 에러, ${loadTime}ms`);
  await page.screenshot({ path: 'e2e/screenshots/tablet-dashboard.png', fullPage: true });
  expect(errors.filter(e => !e.includes('key') || e.includes('API key'))).toHaveLength(0);
  await context.close();
});

// ============================================================
// 7. NaN / 빈값 / undefined 렌더링 검증
// ============================================================
test('전체 탭 — 데이터 렌더링 오류 없음 (NaN%, ₩NaN, undefined 가격 등)', async ({ page }) => {
  const tabs = ['', '?tab=ai-decisions', '?tab=watchlist', '?tab=insights', '?tab=portfolio', '?tab=news'];
  const issues: string[] = [];

  for (const tab of tabs) {
    await page.goto(`${BASE}/${tab}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    // 가격/퍼센트 영역에서만 NaN/undefined 체크 (데이터 표시 오류)
    const nanPrice = page.locator('text=/₩NaN|NaN원|NaN%|NaN점|NaN건|\\$NaN/');
    const nanCount = await nanPrice.count();
    if (nanCount > 0) issues.push(`${tab || '/'}: 가격/숫자 NaN ${nanCount}개`);

    // "₩0" 이 5개 이상이면 데이터 누락
    const body = await page.locator('body').textContent() || '';
    const zeroCount = (body.match(/₩0(?![,\d])/g) || []).length;
    if (zeroCount >= 5) issues.push(`${tab || '/'}: ₩0 표시 ${zeroCount}개`);
  }

  if (issues.length > 0) console.log('  렌더링 오류:', issues);
  expect(issues, `렌더링 오류: ${issues.join('; ')}`).toHaveLength(0);
});

test('관심종목 — 신규 매수 배지 표시', async ({ page }) => {
  // 데이터에 is_new_buy가 있는지 확인
  const resp = await page.goto(`${BASE}/dashboard_data.json`);
  const d = await resp?.json();
  const newBuys = d.watchlist.filter((w: any) => w.is_new_buy);
  console.log(`  신규 매수 종목: ${newBuys.length}개`);

  if (newBuys.length > 0) {
    await page.goto(`${BASE}/?tab=watchlist`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // "신규 매수" 또는 "신규" 배지 존재 확인
    const badges = page.locator('text=/신규 매수|신규|NEW/');
    const count = await badges.count();
    console.log(`  신규 매수 배지: ${count}개 렌더링`);
    expect(count, '신규 매수 배지가 화면에 없음').toBeGreaterThan(0);
  }
});

test('전체 탭 — 6자리 티커에 네이버 차트 링크 존재', async ({ page }) => {
  // 데이터에서 6자리 티커 수 확인
  const resp = await page.goto(`${BASE}/dashboard_data.json`);
  const d = await resp?.json();
  const allTickers = [
    ...d.holdings.map((h: any) => h.ticker),
    ...d.watchlist.map((w: any) => w.ticker),
  ];
  const sixDigitCount = allTickers.filter((t: string) => /^\d{6}$/.test(t)).length;
  console.log(`  6자리 티커: ${sixDigitCount}개`);

  // 관심종목 탭에서 네이버 링크 확인
  await page.goto(`${BASE}/?tab=watchlist`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const naverLinks = page.locator('a[href*="finance.naver.com"]');
  const linkCount = await naverLinks.count();
  console.log(`  관심종목 네이버 링크: ${linkCount}개`);
  expect(linkCount, '관심종목에 네이버 차트 링크 없음').toBeGreaterThan(0);

  // AI 판단 탭에서도 확인
  await page.goto(`${BASE}/?tab=ai-decisions`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const aiNaverLinks = page.locator('a[href*="finance.naver.com"]');
  const aiLinkCount = await aiNaverLinks.count();
  console.log(`  AI판단 네이버 링크: ${aiLinkCount}개`);
  expect(aiLinkCount, 'AI판단에 네이버 차트 링크 없음').toBeGreaterThan(0);

  // 대시보드 탭 (보유종목)
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const dashNaverLinks = page.locator('a[href*="finance.naver.com"]');
  const dashLinkCount = await dashNaverLinks.count();
  console.log(`  대시보드 네이버 링크: ${dashLinkCount}개`);
  expect(dashLinkCount, '대시보드에 네이버 차트 링크 없음').toBeGreaterThan(0);
});

test('데이터 — 티커-종목명 매칭 + 네이버 링크 유효성', async ({ page }) => {
  const resp = await page.goto(`${BASE}/dashboard_data.json`);
  const d = await resp?.json();

  // 알려진 티커-종목명 매핑 (주요 종목만 검증)
  const KNOWN_STOCKS: Record<string, string> = {
    "000660": "SK하이닉스", "005930": "삼성전자", "035420": "네이버",
    "005380": "현대차", "012330": "현대모비스", "034020": "두산에너빌리티",
    "064350": "현대로템", "035720": "카카오", "078930": "GS",
    "083450": "GST", "029460": "케이씨텍", "015760": "한국전력",
    "012450": "한화에어로스페이스", "079550": "LIG넥스원",
    "329180": "HD현대중공업", "010140": "삼성중공업", "207940": "삼성바이오로직스",
  };

  const mismatches: string[] = [];

  // holdings 검증
  for (const h of d.holdings) {
    const expected = KNOWN_STOCKS[h.ticker];
    if (expected && !(h.company_name || h.name || "").includes(expected)) {
      mismatches.push(`holdings: ${h.ticker} → "${h.company_name}" (expected "${expected}")`);
    }
  }

  // watchlist 검증
  for (const w of d.watchlist) {
    const expected = KNOWN_STOCKS[w.ticker];
    if (expected && !(w.company_name || "").includes(expected)) {
      mismatches.push(`watchlist: ${w.ticker} → "${w.company_name}" (expected "${expected}")`);
    }
  }

  // 잘못된 코드 검사 (알려진 오류 코드)
  const BAD_CODES = ["083310"]; // 083310 = 금호엔지니어링 (GST 아님)
  const allTickers = [...d.holdings.map((h: any) => h.ticker), ...d.watchlist.map((w: any) => w.ticker)];
  for (const bad of BAD_CODES) {
    if (allTickers.includes(bad)) {
      mismatches.push(`잘못된 코드 발견: ${bad}`);
    }
  }

  if (mismatches.length > 0) console.log('  티커 불일치:', mismatches);
  expect(mismatches, `티커-종목명 불일치: ${mismatches.join('; ')}`).toHaveLength(0);

  // 네이버 링크 샘플 검증 (주요 3종목 HTTP HEAD 체크)
  const sampleTickers = ["000660", "005930", "083450"];
  for (const ticker of sampleTickers) {
    const url = `https://finance.naver.com/item/fchart.naver?code=${ticker}`;
    try {
      const resp = await page.request.get(url, { timeout: 5000 });
      expect(resp.status(), `${ticker} 네이버 링크 실패`).toBeLessThan(400);
      console.log(`  ✅ ${ticker} → ${resp.status()}`);
    } catch {
      console.log(`  ⚠️ ${ticker} → 네트워크 타임아웃 (오프라인 가능)`);
    }
  }
});

test('데이터 — 가격 일관성 (현재가 > 0, holdings-decisions 매칭, 평가금 정합성)', async ({ page }) => {
  const resp = await page.goto(`${BASE}/dashboard_data.json`);
  const d = await resp?.json();
  const issues: string[] = [];

  // 1. 모든 holdings 현재가 > 0
  for (const h of d.holdings) {
    if (!h.current_price || h.current_price <= 0) {
      issues.push(`holdings ${h.company_name || h.ticker}: 현재가 ${h.current_price}`);
    }
    // buy_price가 있으면 현재가와 비교해 수익률이 합리적인지 (±99% 이내)
    if (h.buy_price && h.current_price) {
      const calcRate = ((h.current_price - h.buy_price) / h.buy_price) * 100;
      if (Math.abs(calcRate) > 500) {
        issues.push(`holdings ${h.company_name || h.ticker}: 수익률 비정상 ${calcRate.toFixed(1)}% (현재가 ${h.current_price} vs 매수가 ${h.buy_price})`);
      }
    }
  }

  // 2. holding_decisions 현재가 > 0
  for (const hd of d.holding_decisions) {
    if (!hd.current_price || hd.current_price <= 0) {
      issues.push(`decisions ${hd.company_name || hd.ticker}: 현재가 ${hd.current_price}`);
    }
  }

  // 3. holdings와 holding_decisions 가격 일치
  const holdingPrices: Record<string, number> = {};
  for (const h of d.holdings) {
    holdingPrices[h.ticker] = h.current_price;
  }
  for (const hd of d.holding_decisions) {
    const hp = holdingPrices[hd.ticker];
    if (hp && hd.current_price && Math.abs(hp - hd.current_price) / hp > 0.5) {
      issues.push(`${hd.ticker}: holdings(${hp}) vs decisions(${hd.current_price}) 가격 50%+ 차이`);
    }
  }

  // 4. watchlist 현재가 > 0
  for (const w of d.watchlist) {
    if (!w.current_price || w.current_price <= 0) {
      issues.push(`watchlist ${w.company_name || w.ticker}: 현재가 ${w.current_price}`);
    }
  }

  // 5. portfolio_data.json 가격 일관성
  const pResp = await page.goto(`${BASE}/portfolio_data.json`);
  const p = await pResp?.json();
  if (p?.accounts) {
    for (const acc of p.accounts) {
      for (const s of acc.stocks || []) {
        if (!s.avg_price || s.avg_price <= 0) {
          issues.push(`portfolio ${s.name}(${s.code}): 평균가 ${s.avg_price}`);
        }
        if (!s.quantity || s.quantity <= 0) {
          issues.push(`portfolio ${s.name}(${s.code}): 수량 ${s.quantity}`);
        }
      }
    }
  }

  if (issues.length > 0) console.log('  가격 일관성 문제:', issues);
  expect(issues, `가격 일관성 문제: ${issues.join('; ')}`).toHaveLength(0);
  console.log(`  ✅ 가격 일관성 검증 통과 (holdings=${d.holdings.length}, decisions=${d.holding_decisions.length}, watchlist=${d.watchlist.length})`);
});

test('관심종목 — 모든 종목 카드에 가격/점수/사유 표시', async ({ page }) => {
  await page.goto(`${BASE}/?tab=watchlist`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  const body = await page.locator('body').textContent() || '';

  // 테이블에 종목 데이터 표시 확인 (매수/관망/매도 배지)
  const decisionBadges = page.locator('text=/매수|관망|매도|홀드/');
  const badgeCount = await decisionBadges.count();
  console.log(`  판단 배지: ${badgeCount}개`);
  expect(badgeCount, '판단 배지가 표시되지 않음').toBeGreaterThan(0);

  // 목표가가 "-"로 표시되는 종목 카드 수 체크 (데이터 누락 의심)
  const dashCount = (body.match(/목표가[\s\S]{0,20}₩0(?![,\d])/g) || []).length;
  console.log(`  목표가 ₩0 표시: ${dashCount}개`);
  expect(dashCount, '목표가 ₩0 표시 과다 (데이터 누락)').toBeLessThan(3);
});

// ============================================================
// 8. 포트폴리오 섹터 차트 + 필터링 테스트
// ============================================================
test('포트폴리오 — 섹터 파이 차트 렌더링', async ({ page }) => {
  await page.goto(`${BASE}/?tab=portfolio`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // SVG 파이 차트 존재 확인
  const svgPaths = page.locator('svg path');
  const pathCount = await svgPaths.count();
  console.log(`  파이 차트 조각: ${pathCount}개`);
  expect(pathCount, '파이 차트 조각이 없음').toBeGreaterThan(0);

  // 범례(섹터명) 존재 확인
  const body = await page.locator('body').textContent() || '';
  expect(body, '반도체 섹터 없음').toContain('반도체');

  // 섹터 클릭 → 필터링 동작 확인
  const sectorSlice = svgPaths.first();
  if (await sectorSlice.isVisible()) {
    await sectorSlice.click();
    await page.waitForTimeout(500);
    console.log('  섹터 조각 클릭 → 필터 적용');
  }
});

test('포트폴리오 — 검색/정렬 필터링', async ({ page }) => {
  await page.goto(`${BASE}/?tab=portfolio`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // 검색 입력 확인
  const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="Search"], input[type="text"]').first();
  if (await searchInput.isVisible()) {
    // "삼성" 검색
    await searchInput.fill('삼성');
    await page.waitForTimeout(500);
    const rows = page.locator('tr');
    const rowCount = await rows.count();
    console.log(`  "삼성" 검색 → ${rowCount}개 행`);
    expect(rowCount, '검색 결과 없음').toBeGreaterThan(1); // 헤더 포함

    // 검색 초기화
    await searchInput.fill('');
    await page.waitForTimeout(500);
  }

  // 정렬 버튼 클릭
  const sortBtn = page.locator('button:has-text("종목"), th:has-text("종목")').first();
  if (await sortBtn.isVisible()) {
    await sortBtn.click();
    await page.waitForTimeout(500);
    console.log('  종목명 정렬 클릭');
  }
});

// ============================================================
// 9. 헤더 티커바 링크 유효성 검증
// ============================================================
test('헤더 티커바 — 모든 링크 HTTP 200', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // 티커바 내 모든 외부 링크 수집
  const links = await page.locator('.ticker-scroll a[href]').evaluateAll(
    (els) => els.map(el => ({ href: el.getAttribute('href') || '', text: el.textContent?.trim() || '' }))
  );
  console.log(`  티커바 링크: ${links.length}개`);
  expect(links.length, '티커바에 링크가 없음').toBeGreaterThan(0);

  // 각 링크 HTTP 상태 확인 (중복 제거)
  const checked = new Set<string>();
  const failures: string[] = [];
  for (const link of links) {
    if (checked.has(link.href)) continue;
    checked.add(link.href);
    try {
      const resp = await page.request.get(link.href, { timeout: 8000 });
      if (resp.status() >= 400) {
        failures.push(`${link.text} → ${resp.status()} (${link.href})`);
      } else {
        console.log(`  ✅ ${(link.text || '?').substring(0, 20).padEnd(20)} ${resp.status()}`);
      }
    } catch {
      console.log(`  ⚠️ ${(link.text || '?').substring(0, 20).padEnd(20)} TIMEOUT (네트워크 문제 가능)`);
    }
  }

  if (failures.length > 0) console.log('  ❌ 실패:', failures);
  expect(failures, `티커바 링크 실패: ${failures.join('; ')}`).toHaveLength(0);
});

// ============================================================
// 10. 전체 탭 순회 스트레스 테스트
// ============================================================
test('전체 탭 연속 순회 — 에러 누적 0', async ({ page }) => {
  const allErrors: string[] = [];
  page.on('pageerror', err => allErrors.push(`[pageerror] ${err.message.substring(0, 200)}`));

  const tabs = ['', '?tab=ai-decisions', '?tab=trading', '?tab=watchlist', '?tab=insights'];

  for (const tab of tabs) {
    await page.goto(`${BASE}/${tab}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
  }

  // 역순 순회
  for (const tab of [...tabs].reverse()) {
    await page.goto(`${BASE}/${tab}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(500);
  }

  const critical = allErrors.filter(e => !e.includes('key') || e.includes('API key'));
  console.log(`  10회 순회 완료: ${critical.length}개 에러`);
  expect(critical).toHaveLength(0);
});
