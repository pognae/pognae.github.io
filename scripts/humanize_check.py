#!/usr/bin/env python3
"""im-not-ai(humanize-korean) 스킬로 게시물의 AI 문체 티를 점검한다.

사용법:
  python scripts/humanize_check.py scan  <post.md>
      front matter를 떼고 정량 점수·route_hint·탐지 패턴을 출력한다.
  python scripts/humanize_check.py gate  <draft.md> <final.md>
      윤문 전(draft)과 후(final)를 verify_gates.py로 비교한다(변경률·대구·수치 보존).
  python scripts/humanize_check.py stamp <post.md> <sepia-report.md>
      im-not-ai lint가 깨끗하고 sepia refactor 보고서가 있으면 front matter에
      humanize 도장(두 도구 버전 + 본문 sha256)을 찍는다. 도장이 없거나 본문 해시가
      다르면 publish-due-posts.mjs가 발행하지 않는다.

im-not-ai 위치는 IM_NOT_AI_DIR 환경변수, 없으면 이 저장소와 같은 폴더의 im-not-ai/를 쓴다.
  git clone https://github.com/epoko77-ai/im-not-ai ../im-not-ai
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SKILL = Path(os.environ.get("IM_NOT_AI_DIR", REPO.parent / "im-not-ai"))
SEPIA = Path(os.environ.get("SEPIA_DIR", REPO.parent / "sepia"))
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
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    return FRONT_MATTER.sub("", text, count=1).strip() + "\n"


def body_sha256(path: Path) -> str:
    """publish-due-posts.mjs의 bodySha256과 같은 규칙으로 계산해야 한다."""
    return hashlib.sha256(body_of(path).encode("utf-8")).hexdigest()


def git_head(repo: Path) -> str:
    out = subprocess.run(["git", "-C", str(repo), "rev-parse", "--short", "HEAD"],
                         capture_output=True, text=True)
    return out.stdout.strip() or "unknown"


def sepia_version() -> str:
    m = re.search(r'version:\s*"([^"]+)"', (SEPIA / "skills" / "sepia" / "SKILL.md").read_text(encoding="utf-8"))
    return m.group(1) if m else "unknown"


def stamp(post: Path, report: Path) -> int:
    if not (SEPIA / "skills" / "sepia" / "SKILL.md").exists():
        sys.exit(f"sepia를 찾을 수 없습니다: {SEPIA}")
    if not report.exists() or "Deferred:" not in report.read_text(encoding="utf-8"):
        sys.exit(f"sepia refactor 보고서가 없거나 Deferred: 줄이 없습니다: {report}")
    result = lint(body_of(post))
    if result["foreign_script"] or result["stock_phrases"] or result["bold_count"] > 3:
        sys.exit(f"im-not-ai lint 미통과: {json.dumps(result, ensure_ascii=False)}")

    text = post.read_text(encoding="utf-8").replace("\r\n", "\n")
    m = FRONT_MATTER.match(text)
    if not m:
        sys.exit(f"front matter가 없습니다: {post}")
    front = re.sub(r"^humanize:\n(?:  .*\n)*", "", m.group(0)[4:-4] + "\n", flags=re.M).rstrip("\n")
    block = (f"humanize:\n  im_not_ai: \"{git_head(SKILL)}\"\n  sepia: \"{sepia_version()}\"\n"
             f"  body_sha256: \"{body_sha256(post)}\"")
    post.write_bytes(f"---\n{front}\n{block}\n---\n{text[m.end():]}".encode("utf-8"))
    print(f"stamped {post.name}: im-not-ai {git_head(SKILL)}, sepia {sepia_version()}")
    return 0


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
    if len(sys.argv) == 4 and sys.argv[1] == "stamp":
        return stamp(Path(sys.argv[2]), Path(sys.argv[3]))
    print(__doc__)
    return 3


if __name__ == "__main__":
    sys.exit(main())
