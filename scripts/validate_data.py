#!/usr/bin/env python3
"""
MarketPulse 데이터 검증 스크립트

dashboard_data.json과 portfolio_data.json의 데이터 품질을 검증합니다.

실행: python3 scripts/validate_data.py
성공 시 exit 0, 실패 시 exit 1 + 에러 메시지
"""

import json
import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DASHBOARD_PATH = BASE_DIR / "examples" / "dashboard" / "public" / "dashboard_data.json"
PORTFOLIO_PATH = BASE_DIR / "examples" / "dashboard" / "public" / "portfolio_data.json"

# 주요 티커-종목명 매핑 (검증용)
KNOWN_TICKERS = {
    "000660": "SK하이닉스",
    "005930": "삼성전자",
    "035420": "네이버",
    "035720": "카카오",
    "005380": "현대차",
    "012330": "현대모비스",
    "034020": "두산에너빌리티",
    "064350": "현대로템",
}

# 종목 코드: 6자리 숫자 또는 ETF/원자재 코드 (영문+숫자 조합)
CODE_PATTERN = re.compile(r"^(\d{6}|[A-Z0-9]{4,6}|[A-Za-z0-9]{6})$")


def load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_dashboard(data: dict) -> list[str]:
    errors: list[str] = []

    # --- holdings 검증 ---
    holdings = data.get("holdings", [])
    holding_tickers: set[str] = set()

    for i, h in enumerate(holdings):
        ticker = h.get("ticker", "")
        name = h.get("company_name") or h.get("name", f"holdings[{i}]")
        prefix = f"holdings[{i}] ({ticker} {name})"

        # current_price > 0
        cp = h.get("current_price", 0)
        if not cp or cp <= 0:
            errors.append(f"{prefix}: current_price가 0 이하입니다 ({cp})")

        # sector 존재
        if not h.get("sector"):
            errors.append(f"{prefix}: sector가 없습니다")

        # 종목 코드 형식 (6자리 숫자)
        if ticker and not CODE_PATTERN.match(ticker):
            errors.append(f"{prefix}: 종목 코드가 6자리 숫자가 아닙니다 ({ticker})")

        # 티커-종목명 매핑 검증
        if ticker in KNOWN_TICKERS:
            expected = KNOWN_TICKERS[ticker]
            actual = h.get("company_name") or h.get("name", "")
            if expected not in actual and actual not in expected:
                errors.append(
                    f"{prefix}: 종목명 불일치 (기대: {expected}, 실제: {actual})"
                )

        holding_tickers.add(ticker)

    # --- watchlist 검증 ---
    watchlist = data.get("watchlist", [])
    watchlist_tickers: set[str] = set()

    for i, w in enumerate(watchlist):
        ticker = w.get("ticker") or w.get("id", "")
        name = w.get("company_name") or w.get("name", f"watchlist[{i}]")
        prefix = f"watchlist[{i}] ({ticker} {name})"

        # buy_score > 0
        bs = w.get("buy_score", 0)
        if not bs or bs <= 0:
            errors.append(f"{prefix}: buy_score가 0 이하입니다 ({bs})")

        # target_price > 0
        tp = w.get("target_price", 0)
        if not tp or tp <= 0:
            errors.append(f"{prefix}: target_price가 0 이하입니다 ({tp})")

        # stop_loss > 0
        sl = w.get("stop_loss", 0)
        if not sl or sl <= 0:
            errors.append(f"{prefix}: stop_loss가 0 이하입니다 ({sl})")

        # sector 존재
        if not w.get("sector"):
            errors.append(f"{prefix}: sector가 없습니다")

        # 종목 코드 형식
        if ticker and not CODE_PATTERN.match(ticker):
            errors.append(f"{prefix}: 종목 코드가 6자리 숫자가 아닙니다 ({ticker})")

        watchlist_tickers.add(ticker)

    # --- holdings와 watchlist 중복 검사 ---
    duplicates = holding_tickers & watchlist_tickers
    if duplicates:
        for dup in sorted(duplicates):
            errors.append(f"중복: 티커 {dup}가 holdings와 watchlist 모두에 존재합니다")

    return errors


def validate_portfolio(data: dict) -> list[str]:
    errors: list[str] = []

    accounts = data.get("accounts", [])
    for ai, account in enumerate(accounts):
        acc_name = account.get("name", f"accounts[{ai}]")
        stocks = account.get("stocks", [])

        for si, stock in enumerate(stocks):
            code = stock.get("code", "")
            name = stock.get("name", f"stocks[{si}]")
            prefix = f"portfolio {acc_name} / {name} ({code})"

            # sector 존재
            if not stock.get("sector"):
                errors.append(f"{prefix}: sector가 없습니다")

            # 종목 코드 형식 (6자리 숫자)
            if code and not CODE_PATTERN.match(code):
                errors.append(f"{prefix}: 종목 코드가 6자리 숫자가 아닙니다 ({code})")

            # 티커-종목명 매핑 검증
            if code in KNOWN_TICKERS:
                expected = KNOWN_TICKERS[code]
                if expected not in name and name not in expected:
                    errors.append(
                        f"{prefix}: 종목명 불일치 (기대: {expected}, 실제: {name})"
                    )

    return errors


def main() -> int:
    all_errors: list[str] = []

    # dashboard_data.json 검증
    if not DASHBOARD_PATH.exists():
        all_errors.append(f"파일 없음: {DASHBOARD_PATH}")
    else:
        dashboard = load_json(DASHBOARD_PATH)
        all_errors.extend(validate_dashboard(dashboard))

    # portfolio_data.json 검증
    if not PORTFOLIO_PATH.exists():
        all_errors.append(f"파일 없음: {PORTFOLIO_PATH}")
    else:
        portfolio = load_json(PORTFOLIO_PATH)
        all_errors.extend(validate_portfolio(portfolio))

    if all_errors:
        print(f"[FAIL] 데이터 검증 실패 ({len(all_errors)}건)")
        for err in all_errors:
            print(f"  - {err}")
        return 1
    else:
        print("[OK] 데이터 검증 통과")
        return 0


if __name__ == "__main__":
    sys.exit(main())
