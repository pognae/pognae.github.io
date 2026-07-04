#!/usr/bin/env node
/**
 * _posts-pending 잔여 글 → _preview/ 복사 (빌드 시 미리보기 URL 생성)
 * URL: /preview/YYYY/MM/DD/slug/
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PENDING = path.join(ROOT, "_posts-pending");
const PREVIEW = path.join(ROOT, "_preview");

function parseFileDate(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!m) return null;
  return { date: m[1], slug: m[2] };
}

function injectPreviewFrontMatter(content, dateStr) {
  const dateLine = `date: ${dateStr} 09:00:00 +0900`;
  const previewLine = "preview: true";

  if (/^---\n/m.test(content)) {
    let body = content;
    if (!/^date:/m.test(body)) {
      body = body.replace(/^---\n/, `---\n${dateLine}\n`);
    }
    if (!/^preview:/m.test(body)) {
      body = body.replace(/^---\n/, `---\n${previewLine}\n`);
    }
    return body;
  }

  return `---\nlayout: post\n${dateLine}\n${previewLine}\n---\n${content}`;
}

fs.rmSync(PREVIEW, { recursive: true, force: true });
fs.mkdirSync(PREVIEW, { recursive: true });

if (!fs.existsSync(PENDING)) {
  console.log("No pending posts for preview.");
  process.exit(0);
}

let count = 0;

for (const file of fs.readdirSync(PENDING)) {
  if (!file.endsWith(".md")) continue;

  const parsed = parseFileDate(file);
  if (!parsed) continue;

  const src = path.join(PENDING, file);
  const dest = path.join(PREVIEW, `${parsed.slug}.md`);
  const raw = fs.readFileSync(src, "utf8");
  const out = injectPreviewFrontMatter(raw, parsed.date);

  fs.writeFileSync(dest, out, "utf8");
  console.log(`Preview: /preview/${parsed.date.replace(/-/g, "/")}/${parsed.slug}/`);
  count += 1;
}

console.log(`Done. ${count} preview post(s) synced.`);
