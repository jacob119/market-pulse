"""
Agent Runner — 에이전트 태스크 병렬/순차 실행기
mcp-agent의 MCPApp.run() 컨텍스트를 대체
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Optional

from cores.llm_client import LLMClient, get_llm_client

logger = logging.getLogger(__name__)


@dataclass
class AgentTask:
    """단일 에이전트 태스크 정의"""
    name: str
    system_prompt: str
    user_message: str
    model: Optional[str] = None
    max_tokens: int = 8192
    temperature: float = 0.3
    depends_on: list[str] = field(default_factory=list)


@dataclass
class AgentResult:
    """에이전트 실행 결과"""
    name: str
    content: str
    elapsed_seconds: float
    success: bool
    error: Optional[str] = None


class AgentRunner:
    """에이전트 태스크 병렬/순차 실행기"""

    def __init__(
        self,
        llm_client: Optional[LLMClient] = None,
        max_concurrent: int = 4,
    ):
        self.llm = llm_client or get_llm_client()
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def _run_single(self, task: AgentTask) -> AgentResult:
        """단일 에이전트 실행"""
        start = time.time()
        try:
            async with self.semaphore:
                logger.info(f"[{task.name}] 분석 시작...")
                content = await self.llm.generate_with_retry(
                    system_prompt=task.system_prompt,
                    user_message=task.user_message,
                    model=task.model,
                    max_tokens=task.max_tokens,
                    temperature=task.temperature,
                )
                elapsed = time.time() - start
                logger.info(f"[{task.name}] 완료 ({elapsed:.1f}초, {len(content)}자)")
                return AgentResult(
                    name=task.name,
                    content=content,
                    elapsed_seconds=elapsed,
                    success=True,
                )
        except Exception as e:
            elapsed = time.time() - start
            logger.error(f"[{task.name}] 실패 ({elapsed:.1f}초): {e}")
            return AgentResult(
                name=task.name,
                content="",
                elapsed_seconds=elapsed,
                success=False,
                error=str(e),
            )

    async def run_parallel(self, tasks: list[AgentTask]) -> dict[str, AgentResult]:
        """에이전트들을 병렬 실행 (asyncio.gather)"""
        start = time.time()
        logger.info(f"=== {len(tasks)}개 에이전트 병렬 실행 시작 ===")

        results = await asyncio.gather(
            *[self._run_single(task) for task in tasks],
            return_exceptions=True,
        )

        output = {}
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                output[tasks[i].name] = AgentResult(
                    name=tasks[i].name,
                    content="",
                    elapsed_seconds=0,
                    success=False,
                    error=str(result),
                )
            else:
                output[result.name] = result

        elapsed = time.time() - start
        success = sum(1 for r in output.values() if r.success)
        logger.info(f"=== 병렬 실행 완료: {success}/{len(tasks)} 성공, 총 {elapsed:.1f}초 ===")
        return output

    async def run_sequential(self, tasks: list[AgentTask]) -> dict[str, AgentResult]:
        """에이전트들을 순차 실행"""
        output = {}
        for task in tasks:
            result = await self._run_single(task)
            output[result.name] = result
        return output

    async def run_with_deps(
        self,
        tasks: list[AgentTask],
        context_builder=None,
    ) -> dict[str, AgentResult]:
        """의존성 기반 실행

        1. depends_on이 없는 태스크 → 병렬 실행
        2. depends_on이 있는 태스크 → 의존 태스크 완료 후 실행
           context_builder(task, results)로 user_message에 이전 결과 주입
        """
        results = {}

        # 의존성 없는 태스크 분리
        independent = [t for t in tasks if not t.depends_on]
        dependent = [t for t in tasks if t.depends_on]

        # Phase 1: 독립 태스크 병렬 실행
        if independent:
            phase1 = await self.run_parallel(independent)
            results.update(phase1)

        # Phase 2: 의존 태스크 순차 실행
        for task in dependent:
            if context_builder:
                task.user_message = context_builder(task, results)
            result = await self._run_single(task)
            results[result.name] = result

        return results
