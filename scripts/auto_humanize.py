#!/usr/bin/env python3
"""관리자 화면에서 저장한 글(_admin-queue/*.md)을 im-not-ai → sepia 순서로 자동 윤문하고 도장을 찍는다.

한 글의 처리 순서:
  1. im-not-ai scan(prepare_monolith_input.py)으로 AI 문체 신호를 뽑는다.
  2. quick-rules.md를 지침으로 LLM이 윤문하고 verify_gates.py로 변경률·수치 보존을 확인한다.
  3. sepia refactor(진단 보고서 → 수정)를 LLM이 수행하고 다시 게이트를 통과시킨다.
  4. im-not-ai lint가 깨끗하면 humanize_check.stamp로 도장을 찍어 _posts 또는 _posts-pending에 둔다.
실패하면 큐 파일은 그대로 두고 <이름>.error.txt에 이유를 남긴다(관리자 화면에 표시됨).

필요한 환경변수: NVIDIA_API_KEY. 선택: NIM_MODEL, IM_NOT_AI_DIR, SEPIA_DIR.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import humanize_check as hc  # noqa: E402

REPO = hc.REPO
QUEUE = REPO / "_admin-queue"
REPORTS = REPO / "_humanize-reports"
NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL = os.environ.get("NIM_MODEL") or "moonshotai/kimi-k3"
KST = timezone(timedelta(hours=9))
LINK = re.compile(r"\]\(([^)\s]+)\)")
NUMBER = re.compile(r"\d[\d,.]*")

VENUE = """이 글은 monopoint.app 재테크 블로그 글이다. 지킬 것:
- 작성자의 높임 수준(해요체/합쇼체)과 말투를 그대로 유지한다.
- 마크다운 구조(## 제목, 번호 목록, 표, 링크, ▼ 문구 ▼ 줄, '## 확인할 곳' 섹션)는 유지한다.
- 숫자·금리·세율·날짜·기관명·링크 URL은 한 글자도 바꾸지 않는다. 새로운 사실·수치·경험담을 지어내지 않는다.
- 굵게(**)는 3개 이하로. 한자·일본어 등 외국 문자를 섞지 않는다.
- 다음 표현은 쓰지 않는다: """ + ", ".join(hc.STOCK_PHRASES)


class StepError(Exception):
    pass


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def chat(system: str, user: str, *, max_tokens: int = 12000) -> str:
    key = os.environ.get("NVIDIA_API_KEY")
    if not key:
        raise StepError("NVIDIA_API_KEY가 설정되지 않았습니다")
    payload = json.dumps({
        "model": MODEL,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "temperature": 0.4,
        "max_tokens": max_tokens,
    }).encode("utf-8")
    last = ""
    for attempt in range(3):
        req = urllib.request.Request(NIM_URL, data=payload, headers={
            "Authorization": f"Bearer {key}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=600) as res:
                content = json.loads(res.read())["choices"][0]["message"]["content"] or ""
            return re.sub(r"<think>.*?</think>", "", content, flags=re.S).strip()
        except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError) as e:
            last = str(e)
            time.sleep(10 * (attempt + 1))
    raise StepError(f"NVIDIA NIM 호출 실패({MODEL}): {last}")


def section(text: str, name: str) -> str:
    m = re.search(rf"<<<{name}>>>\s*\n(.*?)(?=\n<<<[A-Z]+>>>|\Z)", text, re.S)
    if not m:
        raise StepError(f"모델 응답에 <<<{name}>>> 구역이 없습니다")
    return m.group(1).strip() + "\n"


def run_py(args: list[str]) -> subprocess.CompletedProcess:
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    return subprocess.run([sys.executable, *args], env=env, capture_output=True, text=True, encoding="utf-8")


def scan(body: str, run_dir: Path) -> dict:
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "01_input.txt").write_text(body, encoding="utf-8")
    run_py([str(hc.SKILL / "scripts" / "prepare_monolith_input.py"), "--run-dir", str(run_dir), "--genre", "blog"])
    metrics_file = run_dir / "00_metrics.json"
    metrics = json.loads(read(metrics_file)) if metrics_file.exists() else {}
    signals = metrics.get("route_signals", {})
    return {
        "route_hint": metrics.get("route_hint"),
        "risk_band": metrics.get("risk_band"),
        "lexical_tell_count": signals.get("lexical_tell_count"),
        "tells": signals.get("v26_tells"),
        "lint": hc.lint(body),
    }


def gate(before: str, after: str, run_dir: Path) -> tuple[int, str]:
    run_dir.mkdir(parents=True, exist_ok=True)
    b, a = run_dir / "gate_before.txt", run_dir / "gate_after.txt"
    b.write_text(before, encoding="utf-8")
    a.write_text(after, encoding="utf-8")
    out = run_py([str(hc.SKILL / "scripts" / "verify_gates.py"), "--before", str(b), "--after", str(a), "--genre", "blog"])
    return out.returncode, (out.stdout + out.stderr)[-3000:]


def check_preserved(before: str, after: str) -> None:
    lost_links = set(LINK.findall(before)) - set(LINK.findall(after))
    if lost_links:
        raise StepError(f"링크가 사라졌습니다: {sorted(lost_links)}")
    lost_numbers = set(NUMBER.findall(before)) - set(NUMBER.findall(after))
    if lost_numbers:
        raise StepError(f"수치가 사라졌거나 바뀌었습니다: {sorted(lost_numbers)[:20]}")


def gated(label: str, before: str, produce, run_dir: Path) -> str:
    """produce(feedback)로 결과를 만들고 게이트(exit 0/1)와 보존 검사를 통과할 때까지 최대 2번 시도한다."""
    feedback = ""
    for _ in range(2):
        after = produce(feedback)
        try:
            check_preserved(before, after)
        except StepError as e:
            feedback = f"직전 결과가 거부됐습니다: {e}. 원문의 링크와 수치를 그대로 두세요."
            continue
        code, out = gate(before, after, run_dir)
        if code <= 1:
            return after
        feedback = f"직전 결과가 im-not-ai 게이트(exit {code})에서 거부됐습니다. 고친 범위를 줄이세요.\n{out[-1500:]}"
    raise StepError(f"{label} 단계가 게이트를 통과하지 못했습니다. {feedback[:800]}")


def im_not_ai_pass(body: str, run_dir: Path) -> tuple[str, dict]:
    report = scan(body, run_dir / "scan_before")
    rules = read(hc.SKILL / "skills" / "humanize-korean" / "references" / "quick-rules.md")
    system = f"너는 한국어 윤문가다. 아래 im-not-ai quick-rules를 따라 AI 문체 티만 고친다.\n\n{rules}\n\n{VENUE}"

    def produce(feedback: str) -> str:
        user = (f"im-not-ai scan 결과:\n{json.dumps(report, ensure_ascii=False)}\n\n{feedback}\n\n"
                f"아래 본문을 윤문해 <<<BODY>>> 줄 다음에 고친 본문 전체만 출력해라.\n\n{body}")
        return section(chat(system, user), "BODY")

    return gated("im-not-ai 윤문", body, produce, run_dir / "gate_im_not_ai"), report


def sepia_pass(body: str, run_dir: Path) -> tuple[str, str]:
    root = hc.SEPIA / "skills" / "sepia"
    refs = ["SKILL.md", "references/professional-pass.md", "references/domains/tech-articles.md",
            "references/discourse-pass.md", "references/style-pass.md"]
    docs = "\n\n".join(f"=== {name} ===\n{read(root / name)}" for name in refs)
    system = (f"너는 sepia 스킬을 실행하는 편집자다. 아래 문서가 sepia 스킬 전체 지침이다.\n\n{docs}\n\n{VENUE}")

    def produce(feedback: str) -> str:
        user = (
            "operation: refactor. Route: professional-pass + domains/tech-articles + discourse-pass §1-3 + "
            "style-pass §2-3, §4 마지막 문단, §5, §7. 대상: 한국어 블로그 글.\n"
            "먼저 결함 목록을 진단하고(1단계) 그 목록대로만 고쳐라(2단계). 수치·사실은 새로 만들지 않는다.\n"
            "출력 형식(정확히 지킬 것):\n<<<REPORT>>>\nRoute: ...\nFindings:\n- ...\nDeferred: ...\nProtected: ...\nEdits: N\n"
            f"<<<BODY>>>\n(고친 본문 전체)\n\n{feedback}\n\n본문:\n\n{body}"
        )
        reply = chat(system, user)
        report = section(reply, "REPORT")
        if "Deferred:" not in report:
            raise StepError("sepia 보고서에 Deferred: 줄이 없습니다")
        produce.report = report  # type: ignore[attr-defined]
        return section(reply, "BODY")

    final = gated("sepia refactor", body, produce, run_dir / "gate_sepia")
    return final, produce.report  # type: ignore[attr-defined]


def lint_fix(body: str) -> str:
    result = hc.lint(body)
    if not (result["foreign_script"] or result["stock_phrases"] or result["bold_count"] > 3):
        return body
    system = f"너는 한국어 교정자다. 지적된 항목만 최소로 고친다.\n\n{VENUE}"
    user = (f"lint 결과: {json.dumps(result, ensure_ascii=False)}\n외국 문자와 금지 표현을 없애고 굵게를 3개 이하로 줄여라. "
            f"다른 문장은 건드리지 마라. <<<BODY>>> 줄 다음에 본문 전체만 출력.\n\n{body}")
    fixed = section(chat(system, user), "BODY")
    check_preserved(body, fixed)
    return fixed


def split_post(text: str) -> tuple[str, str]:
    text = text.replace("\r\n", "\n")
    m = hc.FRONT_MATTER.match(text)
    if not m:
        raise StepError("front matter가 없습니다")
    return m.group(0)[4:-4], text[m.end():].strip() + "\n"


def fm_value(front: str, key: str) -> str:
    m = re.search(rf'^{key}:\s*"?([^"\n]*)"?\s*$', front, re.M)
    return m.group(1).strip() if m else ""


def is_due(front: str, filename: str) -> bool:
    m = re.match(r"(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2})(?::\d{2})?)?\s*([+-]\d{2}:?\d{2})?", fm_value(front, "date"))
    if m:
        offset = (m.group(3) or "+09:00").replace(":", "")
        when = datetime.strptime(f"{m.group(1)} {m.group(2) or '00:00'} {offset}", "%Y-%m-%d %H:%M %z")
    else:
        when = datetime.strptime(filename[:10], "%Y-%m-%d").replace(tzinfo=KST)
    return when <= datetime.now(timezone.utc)


def process(job: Path) -> str:
    front, body = split_post(read(job))
    name = job.name
    source = fm_value(front, "admin_source")
    front = re.sub(r"^(admin_source|admin_queued_at):.*\n?", "", front, flags=re.M).rstrip("\n")
    front = re.sub(r"^humanize:\n(?:  .*\n?)*", "", front + "\n", flags=re.M).rstrip("\n")

    with tempfile.TemporaryDirectory() as tmp:
        run_dir = Path(tmp)
        step1, scan_before = im_not_ai_pass(body, run_dir)
        step2, sepia_report = sepia_pass(step1, run_dir)
        final = lint_fix(step2)
        code, gate_out = gate(body, final, run_dir / "gate_total")
        if code > 1:
            raise StepError(f"원문 대비 최종 게이트 실패(exit {code}): {gate_out[-800:]}")
        scan_after = scan(final, run_dir / "scan_after")

    REPORTS.mkdir(exist_ok=True)
    report = REPORTS / name
    report.write_text(
        f"# {name}\n\nmodel: {MODEL}\nprocessed_at: {datetime.now(KST).isoformat(timespec='seconds')}\n\n"
        f"## im-not-ai scan (원문)\n```json\n{json.dumps(scan_before, ensure_ascii=False, indent=2)}\n```\n\n"
        f"## im-not-ai scan (최종)\n```json\n{json.dumps(scan_after, ensure_ascii=False, indent=2)}\n```\n\n"
        f"## sepia refactor 보고서\n{sepia_report}\n", encoding="utf-8")

    dest = REPO / ("_posts" if is_due(front, name) else "_posts-pending") / name
    dest.write_bytes(f"---\n{front}\n---\n\n{final}".encode("utf-8"))
    try:
        hc.stamp(dest, report)
    except SystemExit as e:
        dest.unlink()
        raise StepError(f"도장 실패: {e}") from None

    other = REPO / ("_posts-pending" if dest.parent.name == "_posts" else "_posts") / name
    if other.exists():
        other.unlink()
    if source and source != f"{dest.parent.name}/{name}":
        old = REPO / source
        if old.exists() and old.resolve() != dest.resolve():
            old.unlink()
    return f"{dest.parent.name}/{name}"


def main() -> int:
    if not (hc.SKILL / "scripts" / "verify_gates.py").exists():
        sys.exit(f"im-not-ai를 찾을 수 없습니다: {hc.SKILL}")
    if not (hc.SEPIA / "skills" / "sepia" / "SKILL.md").exists():
        sys.exit(f"sepia를 찾을 수 없습니다: {hc.SEPIA}")
    jobs = sorted(QUEUE.glob("*.md")) if QUEUE.exists() else []
    if not jobs:
        print("처리할 글이 없습니다.")
        return 0
    failed = 0
    for job in jobs:
        error = job.with_suffix(".error.txt")
        try:
            dest = process(job)
        except StepError as e:
            failed += 1
            error.write_text(f"{datetime.now(KST).isoformat(timespec='seconds')}\n{e}\n", encoding="utf-8")
            print(f"FAIL {job.name}: {e}")
            continue
        job.unlink()
        if error.exists():
            error.unlink()
        print(f"OK   {job.name} -> {dest}")
    return 1 if failed == len(jobs) else 0


if __name__ == "__main__":
    sys.exit(main())
