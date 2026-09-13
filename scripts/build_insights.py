"""
Olist 巴西电商经营分析 — 构建前端看板所需的汇总 JSON。
用法: python scripts/build_insights.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# 保证以脚本方式运行时可导入 lib
sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import build_insights, load_raw
from lib.paths import OUT


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    print("Loading raw CSVs ...")
    dfs = load_raw()
    print("Building insights ...")
    payload = build_insights(dfs)
    out_file = OUT / "insights.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Wrote {out_file} ({out_file.stat().st_size / 1024:.1f} KB)")
    print("KPIs:", json.dumps(payload["kpis"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
