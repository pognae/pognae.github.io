#!/usr/bin/env node
/**
 * _posts-pending → _posts 자동 이동
 * front matter의 date(예: 2026-10-08 15:00:00 +0900)가 현재 시각 이하이면 발행(이동).
 * date가 없으면 파일명 앞 YYYY-MM-DD(KST 00:00)를 기준으로 한다.
 * cron: 매일 09:00·15:00 KST (UTC 00:00, 06:00) + repository_dispatch 백업
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = process.cwd();
const PENDING = path.join(ROOT, "_posts-pending");
const POSTS = path.join(ROOT, "_posts");

// 이 날짜 이후 파일명을 가진 글은 im-not-ai + sepia 처리 도장(humanize 블록)이 있어야 발행된다.
const HUMANIZE_REQUIRED_FROM = "2026-10-07";
// 도장 제도 이전에 작성된 예약 글
const HUMANIZE_EXEMPT = new Set([
  "2026-10-09-gold-investment-methods.md",
  "2026-10-13-ipo-subscription-basics.md",
  "2026-10-16-savings-vs-deposit-interest.md",
]);

/** scripts/humanize_check.py의 body_sha256과 같은 규칙 */
export function bodySha256(text) {
  const body = text.replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n/, "").trim() + "\n";
  return crypto.createHash("sha256").update(body, "utf8").digest("hex");
}

export function humanizeStatus(filePath) {
  const file = path.basename(filePath);
  const parsed = parseFileDate(file);
  const text = fs.readFileSync(filePath, "utf8");
  const fm = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n/);
  const block = fm && fm[1].match(/^humanize:\n((?: {2}.*\n?)+)/m);
  // 관리자 화면을 거쳐 도장을 받은 옛 글도 이후 본문이 바뀌면 다시 막는다.
  const legacy = !parsed || parsed.date < HUMANIZE_REQUIRED_FROM || HUMANIZE_EXEMPT.has(file);
  if (legacy && !block) return { required: false, ok: true };
  if (!block) return { required: true, ok: false, reason: "humanize 도장 없음" };
  const field = (name) => (block[1].match(new RegExp(`^ {2}${name}:\\s*"?([^"\\n]+)"?`, "m")) || [])[1];
  if (!field("im_not_ai") || !field("sepia")) {
    return { required: true, ok: false, reason: "im_not_ai/sepia 기록 누락" };
  }
  if (field("body_sha256") !== bodySha256(text)) {
    return { required: true, ok: false, reason: "도장 이후 본문이 바뀜(body_sha256 불일치)" };
  }
  return { required: true, ok: true };
}

export function parseFileDate(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+\.md)$/);
  if (!m) return null;
  return { date: m[1], slug: m[2] };
}

export function publishTime(filePath, fileDate) {
  const text = fs.readFileSync(filePath, "utf8");
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const line = fm && fm[1].match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?\s*([+-]\d{2}:?\d{2})?/m);
  if (line) {
    const time = line[2] ? (line[2].length === 5 ? `${line[2]}:00` : line[2]) : "00:00:00";
    const offset = line[3] ? line[3].replace(/^([+-]\d{2})(\d{2})$/, "$1:$2") : "+09:00";
    return new Date(`${line[1]}T${time}${offset}`);
  }
  return new Date(`${fileDate}T00:00:00+09:00`);
}

export function isDue(filePath, fileDate, now = new Date()) {
  return publishTime(filePath, fileDate) <= now;
}

function main() {
  if (!fs.existsSync(PENDING)) {
    console.log("No _posts-pending folder.");
    return;
  }

  const now = new Date();
  console.log(`Publish check (now): ${now.toISOString()}`);

  for (const file of fs.readdirSync(POSTS)) {
    if (!file.endsWith(".md")) continue;
    const status = humanizeStatus(path.join(POSTS, file));
    if (status.ok) continue;
    fs.renameSync(path.join(POSTS, file), path.join(PENDING, file));
    console.warn(`Unpublished (${status.reason}): ${file}`);
  }

  let moved = 0;
  for (const file of fs.readdirSync(PENDING)) {
    if (!file.endsWith(".md")) continue;

    const parsed = parseFileDate(file);
    if (!parsed) {
      console.warn(`Skip (bad filename): ${file}`);
      continue;
    }

    const src = path.join(PENDING, file);
    if (!isDue(src, parsed.date, now)) {
      console.log(`Pending: ${file} (${publishTime(src, parsed.date).toISOString()})`);
      continue;
    }
    const status = humanizeStatus(src);
    if (!status.ok) {
      console.warn(`Blocked (${status.reason}): ${file}`);
      continue;
    }

    const dest = path.join(POSTS, file);
    if (fs.existsSync(dest)) {
      console.warn(`Already in _posts: ${file}`);
      fs.unlinkSync(src);
      continue;
    }

    fs.renameSync(src, dest);
    console.log(`Published: ${file}`);
    moved += 1;
  }

  console.log(`Done. ${moved} post(s) moved to _posts.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
