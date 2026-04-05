"""
Macro Pipeline — Investment Alpha 매크로 분석 파이프라인
6인 전문가 에이전트의 거시경제/원자재/주식/부동산 분석을 Claude 직접 호출로 실행
"""

import asyncio
import logging
import time
from datetime import datetime
from pathlib import Path

from cores.llm_client import LLMClient, get_llm_client
from cores.agent_runner import AgentTask, AgentRunner

logger = logging.getLogger(__name__)

AGENTS_DIR = Path(__file__).parent.parent / ".claude" / "agents"
REPORTS_DIR = Path(__file__).parent.parent / "reports" / "macro"


def load_agent_prompt(filename: str) -> str:
    """에이전트 마크다운 파일에서 instruction 로드"""
    path = AGENTS_DIR / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    logger.warning(f"에이전트 파일 없음: {path}")
    return ""


# 에이전트별 출력 파일 매핑
MACRO_AGENTS = {
    "거시경제": {
        "file": "macro-economist.md",
        "output": "macro_economy_report.md",
        "search_keywords": "금리 GDP 인플레이션 환율 연준 고용 지정학",
    },
    "원자재": {
        "file": "commodity-analyst.md",
        "output": "commodity_report.md",
        "search_keywords": "금 은 원유 구리 원자재 중앙은행 Gold Silver Oil",
    },
    "주식": {
        "file": "stock-analyst.md",
        "output": "stock_market_report.md",
        "search_keywords": "S&P500 KOSPI 나스닥 반도체 AI 종목추천 ETF",
    },
    "부동산": {
        "file": "real-estate-analyst.md",
        "output": "real_estate_report.md",
        "search_keywords": "서울 아파트 부동산 전세 REITs 금리 정책",
    },
}

CHIEF_AGENT = {
    "file": "chief-analyst.md",
    "outputs": ["final_investment_report.md", "timing_strategy_report.md"],
}


async def run_macro_analysis(date: str = None) -> dict[str, str]:
    """4명 전문가 병렬 분석 → 종합 분석가 순차 실행"""

    date = date or datetime.now().strftime("%Y년 %m월 %d일")
    timestamp = datetime.now().strftime("%Y년 %m월 %d일 %H:%M KST")

    start = time.time()
    logger.info(f"=== Investment Alpha 매크로 분석 시작 ({date}) ===")

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # Phase 1: 4명 전문가 병렬 실행
    expert_tasks = []
    for name, config in MACRO_AGENTS.items():
        prompt = load_agent_prompt(config["file"])
        if not prompt:
            continue

        expert_tasks.append(AgentTask(
            name=name,
            system_prompt=prompt,
            user_message=f"""오늘 날짜: {date}
작성일시를 '{timestamp}'로 기입해주세요.

{date} 기준으로 최신 분석 리포트를 작성해주세요.
관련 키워드: {config['search_keywords']}

한국어로 마크다운 형식으로 작성하세요.""",
            max_tokens=8192,
        ))

    runner = AgentRunner(max_concurrent=4)
    results = await runner.run_parallel(expert_tasks)

    # 결과 저장
    reports = {}
    for name, config in MACRO_AGENTS.items():
        if name in results and results[name].success:
            output_path = REPORTS_DIR / config["output"]
            output_path.write_text(results[name].content, encoding="utf-8")
            reports[name] = results[name].content
            logger.info(f"[{name}] 리포트 저장: {output_path}")

    # Phase 2: 종합 분석가 (4개 리포트 통합)
    chief_prompt = load_agent_prompt(CHIEF_AGENT["file"])
    if chief_prompt and reports:
        sections = "\n\n---\n\n".join([
            f"# {name} 분석 리포트\n\n{content}"
            for name, content in reports.items()
        ])

        chief_task = AgentTask(
            name="종합분석",
            system_prompt=chief_prompt,
            user_message=f"""오늘 날짜: {date}
작성일시를 '{timestamp}'로 기입해주세요.

아래 4명의 전문가 리포트를 종합하여 최종 투자 분석 리포트와 매수 타이밍 전략 리포트를 작성해주세요.

{sections}""",
            max_tokens=16384,
        )

        chief_result = await runner._run_single(chief_task)

        if chief_result.success:
            # 종합 리포트 저장
            output_path = REPORTS_DIR / "final_investment_report.md"
            output_path.write_text(chief_result.content, encoding="utf-8")
            reports["종합"] = chief_result.content
            logger.info(f"[종합] 리포트 저장: {output_path}")

    elapsed = time.time() - start
    success = sum(1 for r in results.values() if r.success)
    logger.info(f"=== 매크로 분석 완료: {success}/{len(expert_tasks)} 전문가 + 종합, 총 {elapsed:.1f}초 ===")

    return reports


# CLI 실행
if __name__ == "__main__":
    import sys

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    date = sys.argv[1] if len(sys.argv) > 1 else None
    reports = asyncio.run(run_macro_analysis(date))
    print(f"\n생성된 리포트: {len(reports)}개")
    for name, content in reports.items():
        print(f"  - {name}: {len(content)}자")
