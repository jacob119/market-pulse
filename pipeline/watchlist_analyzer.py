"""
Watchlist Analyzer — Investment Alpha 팀 기반 일관된 종목 분석
보유종목(holdings) + 관심종목(watchlist) 통합 분석

분석 체계:
  1. 보유 20종목 → 전략 판단 (홀드/매수/매도) + 사유
  2. 관심 30종목 → 매수 적합성 평가 + 점수
  3. 공통: pykrx 데이터 + Claude 분석 (Investment Alpha chief-analyst 프롬프트 기반)
"""
import json, asyncio, time, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pykrx import stock as pykrx_stock
from datetime import datetime, timedelta
from pathlib import Path

DASHBOARD_JSON = Path(__file__).parent.parent / "examples" / "dashboard" / "public" / "dashboard_data.json"
PORTFOLIO_JSON = Path(__file__).parent.parent / "examples" / "dashboard" / "public" / "portfolio_data.json"

# Investment Alpha 종합 분석가 프롬프트 (chief-analyst 기반)
ANALYST_SYSTEM = """당신은 Investment Alpha 팀의 종합 투자 분석가입니다.
거시경제, 원자재, 섹터, 기술적 분석을 종합하여 일관된 투자 판단을 내립니다.

분석 원칙:
1. 감정 배제 — 퀀트 데이터와 팩트 기반 판단
2. 리스크 우선 — 손절가/목표가 항상 명시
3. 섹터 연계 — 개별 종목을 매크로 환경과 연결
4. 포트폴리오 관점 — 분산투자, 비중 관리 고려"""


async def analyze_batch(stocks: list[dict], mode: str) -> list[dict]:
    """종목 배치를 Claude에게 일괄 분석 요청

    Args:
        client: LLMClient
        stocks: [{"code": "000660", "name": "SK하이닉스", "sector": "반도체", "price": 876000, "ohlcv": "..."}]
        mode: "holdings" (보유) or "watchlist" (관심)
    """
    if not stocks:
        return []

    import json_repair

    # 종목 데이터 텍스트 구성
    stocks_text = ""
    for s in stocks:
        stocks_text += f"\n### {s['name']}({s['code']}) — {s['sector']}\n"
        stocks_text += f"현재가: {s['price']:,}원"
        if s.get('avg_price'):
            rate = round((s['price'] - s['avg_price']) / s['avg_price'] * 100, 1)
            stocks_text += f" | 매수가: {s['avg_price']:,}원 | 수익률: {rate:+.1f}%"
        stocks_text += f"\n{s.get('ohlcv', '데이터 없음')}\n"

    if mode == "holdings":
        user_msg = f"""다음 보유 종목 {len(stocks)}개를 분석해주세요.

{stocks_text}

각 종목에 대해 JSON 배열로 응답:
[{{
  "code": "000660",
  "decision": "홀드/매수/매도",
  "buy_score": 0~100,
  "target_price": 목표가,
  "stop_loss": 손절가,
  "rationale": "전략 사유 (100자+, 구체적 근거)",
  "portfolio_analysis": "기술적 분석 (100자+)",
  "sector_outlook": "섹터 전망 (80자+)",
  "market_condition": "시장 환경 (80자+)",
  "investment_period": "단기/중기/장기"
}}]"""
    else:
        user_msg = f"""다음 관심 종목 {len(stocks)}개의 매수 적합성을 평가해주세요.

{stocks_text}

각 종목에 대해 JSON 배열로 응답:
[{{
  "code": "000660",
  "decision": "매수/관망/매도",
  "buy_score": 0~100,
  "target_price": 목표가,
  "stop_loss": 손절가,
  "rationale": "매수/관망/매도 사유 (100자+)",
  "portfolio_analysis": "기술적 분석 (80자+)",
  "sector_outlook": "섹터 전망 (60자+)",
  "market_condition": "시장 환경 (60자+)",
  "investment_period": "단기/중기/장기"
}}]"""

    # Claude Code CLI 사용 (Max 구독, API 크레딧 불필요)
    import subprocess, re

    claude_path = os.path.expanduser("~/.local/bin/claude")
    if not os.path.exists(claude_path):
        claude_path = "claude"

    full_prompt = f"{ANALYST_SYSTEM}\n\n{user_msg}\n\nJSON 배열만 응답해줘. 다른 텍스트 없이."

    try:
        result = subprocess.run(
            [claude_path, "-p", full_prompt, "--output-format", "text"],
            capture_output=True, text=True, timeout=120,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        )
        output = result.stdout.strip()
        if not output:
            raise ValueError("Claude Code 응답 없음")

        # JSON 배열 추출
        json_match = re.search(r'\[[\s\S]*\]', output)
        if json_match:
            return json.loads(json_repair.repair_json(json_match.group()))
        else:
            raise ValueError("JSON 배열 파싱 실패")
    except Exception as e:
        print(f"  분석 실패: {e}")
        return []


def get_ohlcv(code: str, days: int = 10) -> tuple[int, str]:
    """pykrx에서 OHLCV 데이터 가져오기"""
    try:
        end = datetime.now().strftime('%Y%m%d')
        start = (datetime.now() - timedelta(days=days + 5)).strftime('%Y%m%d')
        df = pykrx_stock.get_market_ohlcv_by_date(start, end, code)
        if df.empty:
            return 0, "데이터 없음"
        cur = int(df.iloc[-1]['종가'])
        text = df.tail(5).to_string()
        return cur, text
    except:
        return 0, "조회 실패"


async def run_analysis():
    """전체 분석 실행"""
    start_time = time.time()

    # 데이터 로드
    with open(DASHBOARD_JSON) as f:
        dashboard = json.load(f)
    with open(PORTFOLIO_JSON) as f:
        portfolio = json.load(f)

    # === 1. 보유종목 분석 ===
    print("=" * 50)
    print("Phase 1: 보유종목 분석 (Investment Alpha)")
    print("=" * 50)

    # 포트폴리오에서 종목 + 평균가 추출
    port_stocks = {}
    for acc in portfolio.get('accounts', []):
        for s in acc.get('stocks', []):
            if s['code'] not in port_stocks:
                port_stocks[s['code']] = {
                    'code': s['code'], 'name': s['name'],
                    'sector': s.get('sector', ''), 'avg_price': s.get('avg_price', 0),
                    'quantity': s.get('quantity', 0),
                }

    # pykrx로 현재가 조회 + OHLCV
    holdings_data = []
    for code, info in port_stocks.items():
        if code in ('GOLD', '0036R0') or not code.isdigit():
            # 특수 티커는 기존 데이터 유지
            continue
        price, ohlcv = get_ohlcv(code)
        if price > 0:
            holdings_data.append({**info, 'price': price, 'ohlcv': ohlcv})
            print(f"  {info['name']:14s} {price:>10,}원")

    # 배치 분석 (10종목씩)
    holdings_results = []
    for i in range(0, len(holdings_data), 10):
        batch = holdings_data[i:i+10]
        print(f"\n  배치 {i//10 + 1}: {len(batch)}종목 분석 중...")
        results = await analyze_batch(batch, "holdings")
        holdings_results.extend(results)
        print(f"  → {len(results)}종목 완료")

    # holdings 업데이트
    result_map = {r['code']: r for r in holdings_results}
    for h in dashboard['holdings']:
        r = result_map.get(h['ticker'])
        if r:
            h['current_price'] = next((hd['price'] for hd in holdings_data if hd['code'] == h['ticker']), h['current_price'])
            h['profit_rate'] = round((h['current_price'] - (h.get('buy_price') or h.get('avg_price') or h['current_price'])) / max(h.get('buy_price') or h.get('avg_price') or 1, 1) * 100, 2)
            h['scenario'] = {
                'decision': r.get('decision', '홀드'),
                'buy_score': r.get('buy_score', 50),
                'target_price': r.get('target_price', 0),
                'stop_loss': r.get('stop_loss', 0),
                'rationale': r.get('rationale', ''),
                'portfolio_analysis': r.get('portfolio_analysis', ''),
                'sector_outlook': r.get('sector_outlook', ''),
                'market_condition': r.get('market_condition', ''),
                'sector': h.get('sector', ''),
                'investment_period': r.get('investment_period', '중기'),
            }
            h['target_price'] = r.get('target_price', h.get('target_price', 0))
            h['stop_loss'] = r.get('stop_loss', h.get('stop_loss', 0))

    # holding_decisions 업데이트
    for hd in dashboard.get('holding_decisions', []):
        r = result_map.get(hd['ticker'])
        if r:
            hd['decision'] = r.get('decision', hd.get('decision', ''))
            hd['confidence'] = r.get('buy_score', hd.get('confidence', 0))
            hd['buy_score'] = r.get('buy_score', 0)
            hd['target_price'] = r.get('target_price', 0)
            hd['stop_loss'] = r.get('stop_loss', 0)
            hd['decision_rationale'] = r.get('rationale', '')
            hd['current_strategy'] = r.get('portfolio_analysis', '')
            hd['technical_trend'] = r.get('portfolio_analysis', '')
            hd['market_impact'] = r.get('market_condition', '')
            hd['time_factor'] = r.get('sector_outlook', '')
            hd['current_price'] = next((hd2['price'] for hd2 in holdings_data if hd2['code'] == hd['ticker']), hd.get('current_price', 0))

    print(f"\n보유종목 분석 완료: {len(holdings_results)}종목")

    # === 2. 관심종목 분석 ===
    print("\n" + "=" * 50)
    print("Phase 2: 관심종목 분석 (Investment Alpha)")
    print("=" * 50)

    watchlist_data = []
    for w in dashboard.get('watchlist', []):
        code = w['ticker']
        if not code.isdigit() or len(code) != 6:
            continue
        price, ohlcv = get_ohlcv(code)
        if price > 0:
            watchlist_data.append({
                'code': code, 'name': w['company_name'],
                'sector': w.get('sector', ''), 'price': price, 'ohlcv': ohlcv,
            })
            print(f"  {w['company_name']:14s} {price:>10,}원")

    # 배치 분석
    watchlist_results = []
    for i in range(0, len(watchlist_data), 10):
        batch = watchlist_data[i:i+10]
        print(f"\n  배치 {i//10 + 1}: {len(batch)}종목 분석 중...")
        results = await analyze_batch(batch, "watchlist")
        watchlist_results.extend(results)
        print(f"  → {len(results)}종목 완료")

    # watchlist 업데이트
    wl_result_map = {r['code']: r for r in watchlist_results}
    for w in dashboard['watchlist']:
        r = wl_result_map.get(w['ticker'])
        if r:
            w['current_price'] = next((wd['price'] for wd in watchlist_data if wd['code'] == w['ticker']), w['current_price'])
            w['buy_score'] = r.get('buy_score', w.get('buy_score', 50))
            w['decision'] = r.get('decision', w.get('decision', '관망'))
            w['target_price'] = r.get('target_price', w.get('target_price', 0))
            w['stop_loss'] = r.get('stop_loss', w.get('stop_loss', 0))
            w['rationale'] = r.get('rationale', '')
            w['skip_reason'] = r.get('rationale', '')
            w['portfolio_analysis'] = r.get('portfolio_analysis', '')
            w['sector_outlook'] = r.get('sector_outlook', '')
            w['market_condition'] = r.get('market_condition', '')
            w['investment_period'] = r.get('investment_period', '중기')
            w['analyzed_date'] = datetime.now().strftime('%Y-%m-%d')

    print(f"\n관심종목 분석 완료: {len(watchlist_results)}종목")

    # === 3. 저장 ===
    dashboard['generated_at'] = datetime.now().isoformat()

    # summary 업데이트
    total_dec = len(dashboard.get('holding_decisions', []))
    if total_dec > 0:
        dashboard['summary']['ai_decisions'] = {
            'total_decisions': total_dec,
            'sell_signals': sum(1 for hd in dashboard['holding_decisions'] if hd.get('decision') == '매도'),
            'hold_signals': sum(1 for hd in dashboard['holding_decisions'] if hd.get('decision') == '홀드'),
            'adjustment_needed': 0,
            'avg_confidence': round(sum(hd.get('confidence', 0) for hd in dashboard['holding_decisions']) / total_dec, 1),
        }

    with open(DASHBOARD_JSON, 'w', encoding='utf-8') as f:
        json.dump(dashboard, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - start_time
    print(f"\n{'=' * 50}")
    print(f"전체 분석 완료: {elapsed:.1f}초 ({elapsed/60:.1f}분)")
    print(f"  보유종목: {len(holdings_results)}개")
    print(f"  관심종목: {len(watchlist_results)}개")
    print(f"{'=' * 50}")


# 이전 호환용 alias
async def main():
    await run_analysis()


if __name__ == '__main__':
    import logging
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_analysis())
