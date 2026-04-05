"""대시보드 데이터 JSON 생성"""
import json
from pathlib import Path
from datetime import datetime

def generate():
    data = {
        "generated_at": datetime.now().isoformat(),
        "portfolio": {"total_value": 338000000, "total_return": 89.2, "currency": "KRW"},
        "macro_reports": [],
        "stock_reports": [],
    }

    macro_dir = Path("reports/macro")
    if macro_dir.exists():
        for f in sorted(macro_dir.glob("*.md")):
            content = f.read_text(encoding="utf-8")
            data["macro_reports"].append({
                "name": f.stem.replace("_", " ").title(),
                "file": f.name,
                "length": len(content),
                "preview": content[:500],
            })

    stocks_dir = Path("reports/stocks")
    if stocks_dir.exists():
        for f in sorted(stocks_dir.glob("*.md")):
            content = f.read_text(encoding="utf-8")
            parts = f.stem.split("_")
            data["stock_reports"].append({
                "code": parts[0] if parts else "",
                "name": parts[1] if len(parts) > 1 else "",
                "date": parts[2] if len(parts) > 2 else "",
                "file": f.name,
                "length": len(content),
                "preview": content[:500],
            })

    output = Path("examples/dashboard/public/dashboard_data.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"대시보드 데이터 생성: {output}")
    return data

if __name__ == "__main__":
    generate()
