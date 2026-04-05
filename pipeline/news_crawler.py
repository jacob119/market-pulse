"""MarketPulse 뉴스 크롤러 — RSS + YouTube + Claude 키워드 분석"""
import feedparser, json, asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
import json_repair

NEWS_FEEDS = {
    '매일경제': 'https://www.mk.co.kr/rss/30100041/',
    '한국경제': 'https://www.hankyung.com/feed/stock',
    '한경글로벌마켓': 'https://www.hankyung.com/feed/globalmarket',
    '연합뉴스': 'https://www.yna.co.kr/rss/economy.xml',
    '조선비즈': 'https://biz.chosun.com/site/data/rss/rss.xml',
    'Investing.com': 'https://kr.investing.com/rss/news.rss',
    'Investing글로벌': 'https://www.investing.com/rss/news_301.rss',
}
YT_CHANNELS = {
    '슈카월드': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCsJ6RuBiTVWRX156FVbeaGg',
    '삼프로TV': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCMeDSk2gMfJWvWBsVFicxYA',
    '올랜도캠퍼스': 'https://www.youtube.com/feeds/videos.xml?channel_id=UC7gAGjR3Bj2t8ewHmV37U_A',
    '소수몽키': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCkW5Jm7bQbVFpENfica0MBQ',
    '체슬리TV': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCPKjw8t2kG1dOXguFKhEkUQ',
    '머니두': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCw2sg9MiQHJaeRJfaYMT4cQ',
    '박곰희TV': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCCFeoO_T1LC4lisHfTr3IuA',
}
OUTPUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                      'examples', 'dashboard', 'public', 'news_data.json')


async def crawl_and_analyze():
    all_articles = []

    # RSS 뉴스
    for name, url in NEWS_FEEDS.items():
        try:
            f = feedparser.parse(url)
            for e in f.entries[:7]:
                all_articles.append({
                    'title': e.get('title', '').strip(),
                    'url': e.get('link', ''),
                    'source': name,
                    'time': e.get('published', '')[:16] or '오늘',
                    'type': 'news',
                })
        except:
            pass

    # 유튜브
    for name, url in YT_CHANNELS.items():
        try:
            f = feedparser.parse(url)
            for e in f.entries[:3]:
                all_articles.append({
                    'title': f'[{name}] {e.get("title", "").strip()}',
                    'url': e.get('link', ''),
                    'source': f'YouTube {name}',
                    'time': e.get('published', '')[:10] or '최근',
                    'type': 'youtube',
                })
        except:
            pass

    print(f'[뉴스] {len(all_articles)}개 수집')
    if not all_articles:
        return

    titles_text = chr(10).join([f'- [{a["source"]}] {a["title"]}' for a in all_articles])
    titles_json = json.dumps([{'idx': i, 'title': a['title']} for i, a in enumerate(all_articles)], ensure_ascii=False)

    # Claude Code CLI로 AI 분석 (API 크레딧 불필요, Max 구독 사용)
    sent_map = {}
    kw_data = {'keywords': []}
    map_dict = {}

    import subprocess, tempfile

    def claude_code_ask(prompt: str) -> str:
        """Claude Code CLI를 통해 분석 요청"""
        claude_path = os.path.expanduser("~/.local/bin/claude")
        if not os.path.exists(claude_path):
            claude_path = "claude"  # PATH에서 찾기
        try:
            result = subprocess.run(
                [claude_path, "-p", prompt, "--output-format", "text"],
                capture_output=True, text=True, timeout=60,
                cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            )
            return result.stdout.strip()
        except Exception as e:
            print(f'  Claude Code 호출 실패: {e}')
            return ""

    try:
        # 1. 키워드 추출 + 감정 + 매핑을 한번에 요청 (토큰 효율화)
        combined_prompt = f"""다음 투자 뉴스 헤드라인을 분석해서 JSON만 응답해줘.

헤드라인:
{titles_text}

다음 JSON 형식으로 응답 (다른 텍스트 없이 JSON만):
{{
  "keywords": [
    {{"word": "키워드", "count": 1~100, "category": "섹터/이슈/종목/경제/글로벌/유튜브", "sentiment": "긍정/부정/중립", "related": ["관련어1"]}}
  ],
  "headlines": [
    {{"idx": 0, "sentiment": "긍정/부정/중립", "importance": 1~10, "keywords": ["매칭키워드"]}}
  ]
}}

키워드는 투자 관련 핵심 30개, 헤드라인은 각각 감정+중요도+키워드 매칭."""

        print('[뉴스] Claude Code로 AI 분석 중...')
        ai_result = claude_code_ask(combined_prompt)

        if ai_result:
            # JSON 추출 (텍스트 사이에서)
            import re
            json_match = re.search(r'\{[\s\S]*\}', ai_result)
            if json_match:
                parsed = json.loads(json_repair.repair_json(json_match.group()))
                kw_data = {'keywords': parsed.get('keywords', [])}
                for h in parsed.get('headlines', []):
                    idx = h.get('idx')
                    if idx is not None:
                        sent_map[idx] = {'sentiment': h.get('sentiment', '중립'), 'importance': h.get('importance', 5)}
                        map_dict[idx] = h.get('keywords', [])
                print(f'  AI 분석 완료: 키워드 {len(kw_data["keywords"])}개')
            else:
                raise ValueError("JSON 파싱 실패")
        else:
            raise ValueError("Claude Code 응답 없음")

    except Exception as e:
        print(f'[뉴스] AI 분석 실패 (폴백 모드): {e}')
        # 폴백: 제목에서 간단한 키워드 추출
        from collections import Counter
        word_counts = Counter()
        for a in all_articles:
            for word in a['title'].split():
                if len(word) >= 2 and word not in ('이후', '대비', '것으로', '따르면', '위해', '통해', '있다', '했다', '한다'):
                    word_counts[word] += 1
        top_words = word_counts.most_common(20)
        kw_data = {'keywords': [
            {'word': w, 'count': c, 'category': '이슈', 'sentiment': '중립', 'related': []}
            for w, c in top_words if c >= 2
        ]}

    # 헤드라인 구성 (유튜브 우선 포함 + 뉴스)
    headlines = []
    seen = set()
    # 유튜브 먼저
    for i, a in enumerate(all_articles):
        if a.get('type') == 'youtube' and a['title'] not in seen:
            seen.add(a['title'])
            info = sent_map.get(i, {'sentiment': '중립', 'importance': 7})
            headlines.append({
                'title': a['title'], 'source': a['source'],
                'time': a.get('time', '오늘'), 'sentiment': info.get('sentiment', '중립'),
                'importance': info.get('importance', 7), 'keywords': map_dict.get(i, []),
                'url': a['url'], 'region': 'KR', 'type': 'youtube',
            })
    # 나머지 뉴스
    for i, a in enumerate(all_articles):
        if a['title'] not in seen and len(headlines) < 40:
            seen.add(a['title'])
            info = sent_map.get(i, {'sentiment': '중립', 'importance': 5})
            headlines.append({
                'title': a['title'],
                'source': a['source'],
                'time': a.get('time', '오늘'),
                'sentiment': info.get('sentiment', '중립'),
                'importance': info.get('importance', 5),
                'keywords': map_dict.get(i, []),
                'url': a['url'],
                'region': 'KR',
                'type': a.get('type', 'news'),
            })
    headlines.sort(key=lambda x: x.get('importance', 0), reverse=True)

    data = {
        'generated_at': datetime.now().isoformat(),
        'keywords': kw_data.get('keywords', []),
        'headlines': headlines,
    }

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    pos = sum(1 for k in data['keywords'] if k.get('sentiment') == '긍정')
    neg = sum(1 for k in data['keywords'] if k.get('sentiment') == '부정')
    print(f'[뉴스] 키워드 {len(data["keywords"])}개(긍정{pos}/부정{neg}), 헤드라인 {len(headlines)}개 저장')


if __name__ == '__main__':
    asyncio.run(crawl_and_analyze())
