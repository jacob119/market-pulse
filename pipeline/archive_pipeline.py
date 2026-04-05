"""
Archive Pipeline — 아카이브 + 인덱스 페이지 생성
"""

import logging
import subprocess
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

REPORTS_DIR = Path(__file__).parent.parent / "reports"


def generate_html_from_md(reports_dir: Path):
    """마크다운 → HTML 변환 (pandoc)"""
    count = 0
    for md_file in reports_dir.glob("**/*.md"):
        html_file = md_file.with_suffix(".html")
        try:
            subprocess.run(
                ["pandoc", str(md_file), "-o", str(html_file),
                 "--standalone", "--metadata", f"title={md_file.stem}"],
                capture_output=True, timeout=30, check=True,
            )
            count += 1
        except Exception as e:
            logger.warning(f"HTML 변환 실패 ({md_file.name}): {e}")
    return count


def archive_daily(date_str: str = None):
    """일일 아카이브 생성"""
    date_str = date_str or datetime.now().strftime("%Y-%m-%d")
    archive_dir = REPORTS_DIR / "archive" / date_str
    archive_dir.mkdir(parents=True, exist_ok=True)

    copied = 0

    # 매크로 리포트 복사
    macro_dir = REPORTS_DIR / "macro"
    if macro_dir.exists():
        for f in macro_dir.glob("*.*"):
            target = archive_dir / f.name
            target.write_bytes(f.read_bytes())
            copied += 1

    # 종목 리포트 복사
    stocks_dir = REPORTS_DIR / "stocks"
    if stocks_dir.exists():
        date_compact = date_str.replace("-", "")
        for f in stocks_dir.glob(f"*{date_compact}*"):
            target = archive_dir / f.name
            target.write_bytes(f.read_bytes())
            copied += 1

    # 아카이브 인덱스 페이지 생성
    generate_archive_index(archive_dir, date_str)

    logger.info(f"아카이브 완료: {archive_dir} ({copied}개 파일)")
    return copied


def generate_archive_index(archive_dir: Path, date_str: str):
    """아카이브 인덱스 HTML 생성"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M KST")

    # 리포트 목록
    reports = []
    for f in sorted(archive_dir.glob("*.html")):
        if f.name != "index.html":
            name = f.stem.replace("_", " ").title()
            reports.append(f'<div class="card"><a href="{f.name}"><div class="card-title">{name}</div></a></div>')

    for f in sorted(archive_dir.glob("*.md")):
        name = f.stem.replace("_", " ").title()
        reports.append(f'<div class="card"><a href="{f.name}"><div class="card-title">{name} (MD)</div></a></div>')

    reports_html = "\n".join(reports) if reports else '<p style="color:#94a3b8;">리포트 없음</p>'

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PRISM-ALPHA - {date_str}</title>
<style>
*{{box-sizing:border-box}}
body{{font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;max-width:960px;margin:0 auto;padding:40px 20px;background:#0f172a;color:#e2e8f0}}
.header{{text-align:center;margin-bottom:30px}}
.header h1{{font-size:2em;color:#f8fafc}}
.header .sub{{color:#60a5fa;font-size:1em}}
.header .meta{{color:#94a3b8;font-size:0.85em;margin-top:4px}}
.nav{{display:flex;justify-content:center;gap:12px;margin-bottom:24px}}
.nav a{{color:#60a5fa;text-decoration:none;font-size:0.85em;padding:6px 14px;border:1px solid #334155;border-radius:8px}}
.nav a:hover{{border-color:#60a5fa;background:#1e293b}}
.card{{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px 20px;margin:8px 0;transition:all 0.2s}}
.card:hover{{border-color:#3b82f6;transform:translateY(-2px)}}
.card a{{text-decoration:none;color:inherit}}
.card-title{{font-size:1em;font-weight:600;color:#f1f5f9}}
.footer{{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #334155;color:#64748b;font-size:0.8em}}
</style>
</head>
<body>
<div class="nav">
  <a href="../../reports/macro/">최신 리포트</a>
</div>
<div class="header">
  <div class="sub">PRISM-ALPHA</div>
  <h1>{date_str} 리포트 아카이브</h1>
  <div class="meta">생성: {timestamp}</div>
</div>
{reports_html}
<div class="footer">
  <p>PRISM-ALPHA | Investment Alpha + PRISM-INSIGHT 통합</p>
</div>
</body>
</html>"""

    (archive_dir / "index.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

    date = sys.argv[1] if len(sys.argv) > 1 else None

    # HTML 생성
    macro_dir = REPORTS_DIR / "macro"
    stocks_dir = REPORTS_DIR / "stocks"
    if macro_dir.exists():
        n = generate_html_from_md(macro_dir)
        print(f"매크로 HTML {n}개 생성")
    if stocks_dir.exists():
        n = generate_html_from_md(stocks_dir)
        print(f"종목 HTML {n}개 생성")

    # 아카이브
    copied = archive_daily(date)
    print(f"아카이브 {copied}개 파일 저장")
