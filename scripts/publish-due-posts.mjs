#!/usr/bin/env node
/**
 * _posts-pending → _posts 자동 이동
 * 파일명 앞 YYYY-MM-DD가 KST 기준 오늘 이하이면 발행(이동)
 * cron: 매일 09:00 KST (UTC 00:00)
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PENDING = path.join(ROOT, "_posts-pending");
const POSTS = path.join(ROOT, "_posts");
const TZ = "Asia/Seoul";

function todayKST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function parseFileDate(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+\.md)$/);
  if (!m) return null;
  return { date: m[1], slug: m[2] };
}

if (!fs.existsSync(PENDING)) {
  console.log("No _posts-pending folder.");
  process.exit(0);
}

const today = todayKST();
console.log(`Publish check (KST date): ${today}`);

let moved = 0;

for (const file of fs.readdirSync(PENDING)) {
  if (!file.endsWith(".md")) continue;

  const parsed = parseFileDate(file);
  if (!parsed) {
    console.warn(`Skip (bad filename): ${file}`);
    continue;
  }

  if (parsed.date > today) {
    console.log(`Pending: ${file} (${parsed.date})`);
    continue;
  }

  const src = path.join(PENDING, file);
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
