"""News Analyzer — Claude API로 한국 투자 뉴스 키워드 분석"""
import json, asyncio, sys, os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cores.llm_client import LLMClient

OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "examples", "dashboard", "public", "news_data.json"
)


async def main():
    client = LLMClient()
    now = datetime.now()
    date_str = now.strftime("%Y년 %m월 %d일")

    print(f"[뉴스 분석] {date_str} 한국 투자 뉴스 키워드 분석 시작...")

    system_prompt = (
        "너는 한국 주식시장 전문 뉴스 분석가야. "
        "현재 날짜 기준으로 한국 투자 시장에서 가장 핫한 키워드와 뉴스 헤드라인을 분석해줘. "
        "반드시 JSON만 응답해. 마크다운 코드블록 없이 순수 JSON만."
    )

    user_message = f"""오늘은 {date_str}이야.

현재 한국 주식시장에서 가장 많이 언급되고 있는 핫 키워드 20개와 최근 주요 뉴스 헤드라인 10개를 분석해줘.

다음 JSON 형식으로 응답해:
{{
  "keywords": [
    {{
      "word": "키워드",
      "count": 빈도수(1~100),
      "category": "섹터|이슈|종목|경제" 중 하나,
      "sentiment": "긍정|부정|중립" 중 하나,
      "related": ["관련키워드1", "관련키워드2"]
    }}
  ],
  "headlines": [
    {{
      "title": "뉴스 제목",
      "source": "출처(매체명)",
      "time": "N시간 전 또는 N일 전",
      "sentiment": "긍정|부정|중립" 중 하나,
      "keywords": ["관련키워드1", "관련키워드2"]
    }}
  ]
}}

키워드는 count 기준 내림차순 정렬. category는 반드시 "섹터", "이슈", "종목", "경제" 중 하나.
현재 시점의 실제 시장 상황을 반영해서 분석해줘."""

    try:
        response = await client.generate(
            system_prompt,
            user_message,
            max_tokens=4096,
            temperature=0.3,
        )

        # JSON 파싱 (코드블록 제거)
        text = response.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        try:
            import json_repair
            data = json.loads(json_repair.repair_json(text))
        except Exception:
            data = json.loads(text)

        # 결과에 생성 시각 추가
        result = {
            "generated_at": now.strftime("%Y-%m-%dT%H:%M:%S"),
            "keywords": data.get("keywords", []),
            "headlines": data.get("headlines", []),
        }

        # 저장
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"[완료] 키워드 {len(result['keywords'])}개, 헤드라인 {len(result['headlines'])}개")
        print(f"[저장] {OUTPUT_PATH}")

    except Exception as e:
        print(f"[오류] {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
