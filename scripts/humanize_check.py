#!/usr/bin/env python3
"""im-not-ai(humanize-korean) 스킬로 게시물의 AI 문체 티를 점검한다.

사용법:
  python scripts/humanize_check.py scan  <post.md>
      front matter를 떼고 정량 점수·route_hint·탐지 패턴을 출력한다.
  python scripts/humanize_check.py gate  <draft.md> <final.md>
      윤문 전(draft)과 후(final)를 verify_gates.py로 비교한다(변경률·대구·수치 보존).

im-not-ai 위치는 IM_NOT_AI_DIR 환경변수, 없으면 이 저장소와 같은 폴더의 im-not-ai/를 쓴다.
  git clone https://github.com/epoko77-ai/im-not-ai ../im-not-ai
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SKILL = Path(os.environ.get("IM_NOT_AI_DIR", REPO.parent / "im-not-ai"))
WORK = REPO / "_workspace"
FRONT_MATTER = re.compile(r"\A---\r?\n.*?\r?\n---\r?\n", re.S)
FOREIGN_SCRIPT = re.compile(r"[\u3040-\u30ff\u0e00-\u0e7f\u0900-\u097f\u4e00-\u9fff]")
STOCK_PHRASES = [
    "결론적으로", "요약하면", "정리하자면", "알아보겠습니다", "살펴보겠습니다", "완벽 정리",
    "총정리", "도움이 되셨", "시사하는 바", "주목할 만", "할 때입니다", "다음과 같습니다",
    "매우 중요", "이를 통해", "가지고 있습니다", "에 있어서", "되어지", "되어집니다",
    "단순한", "제공해주신", "프롬프트", "SEO", "도입부", "서론", "Executive Summary",
]


def lint(text: str) -> dict:
    return {
        "foreign_script": sorted(set(FOREIGN_SCRIPT.findall(text))),
        "stock_phrases": {p: text.count(p) for p in STOCK_PHRASES if p in text},
        "bold_count": text.count("**") // 2,
        "bullet_lines": sum(1 for line in text.splitlines() if re.match(r"\s*([-*+]|\d+\.)\s", line)),
    }


def body_of(path: Path) -> str:
    return FRONT_MATTER.sub("", path.read_text(encoding="utf-8"), count=1).strip() + "\n"


def run(args: list[str]) -> int:
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    return subprocess.run([sys.executable, *args], env=env).returncode


def scan(post: Path) -> int:
    run_dir = WORK / post.stem
    run_dir.mkdir(parents=True, exist_ok=True)
    body = body_of(post)
    (run_dir / "01_input.txt").write_text(body, encoding="utf-8")
    code = run([str(SKILL / "scripts" / "prepare_monolith_input.py"),
                "--run-dir", str(run_dir), "--genre", "blog"])
    metrics = json.loads((run_dir / "00_metrics.json").read_text(encoding="utf-8"))
    signals = metrics.get("route_signals", {})
    print(json.dumps({
        "chars": metrics.get("char_count"),
        "route_hint": metrics.get("route_hint"),
        "route_reason": metrics.get("route_reason"),
        "risk_band": metrics.get("risk_band"),
        "lexical_tell_count": signals.get("lexical_tell_count"),
        "tells": signals.get("v26_tells"),
        "evidence": metrics.get("evidence"),
        "interference": metrics.get("v2_interference_index", {}).get("components"),
        "lint": lint(body),
    }, ensure_ascii=False, indent=2))
    return code


def gate(draft: Path, final: Path) -> int:
    run_dir = WORK / final.stem
    run_dir.mkdir(parents=True, exist_ok=True)
    before, after = run_dir / "01_input.txt", run_dir / "final.md"
    before.write_text(body_of(draft), encoding="utf-8")
    after.write_text(body_of(final), encoding="utf-8")
    return run([str(SKILL / "scripts" / "verify_gates.py"),
                "--before", str(before), "--after", str(after), "--genre", "blog"])


def main() -> int:
    if not (SKILL / "scripts" / "verify_gates.py").exists():
        sys.exit(f"im-not-ai를 찾을 수 없습니다: {SKILL}")
    if len(sys.argv) == 3 and sys.argv[1] == "scan":
        return scan(Path(sys.argv[2]))
    if len(sys.argv) == 4 and sys.argv[1] == "gate":
        return gate(Path(sys.argv[2]), Path(sys.argv[3]))
    print(__doc__)
    return 3


if __name__ == "__main__":
    sys.exit(main())
