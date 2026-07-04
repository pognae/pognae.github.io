#!/usr/bin/env node
/**
 * 자동 발행 파이프라인 상태 점검 (CI·로컬 공용)
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PENDING = path.join(ROOT, "_posts-pending");
const POSTS = path.join(ROOT, "_posts");
const WORKFLOW = path.join(ROOT, ".github/workflows/pages.yml");
const TZ = "Asia/Seoul";

function todayKST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function countMd(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).length;
}

function dueTodayIn(dir) {
  const today = todayKST();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md") && f.startsWith(today + "-"));
}

const today = todayKST();
const duePending = dueTodayIn(PENDING);
const duePosts = dueTodayIn(POSTS);
const dueTotal = duePending.length + duePosts.length;
const pendingTotal = countMd(PENDING);
const postsTotal = countMd(POSTS);
const hasWorkflow = fs.existsSync(WORKFLOW);
const workflowText = hasWorkflow ? fs.readFileSync(WORKFLOW, "utf8") : "";

console.log("=== Calc365 블로그 자동 발행 점검 ===");
console.log(`KST 오늘: ${today}`);
console.log(`_posts-pending: ${pendingTotal}편`);
console.log(`_posts (발행됨): ${postsTotal}편`);
console.log(`오늘 글 — pending: ${duePending.length}편, _posts: ${duePosts.length}편`);

const checks = [
  {
    name: "GitHub Actions workflow 존재",
    ok: hasWorkflow,
    fix: ".github/workflows/pages.yml 추가",
  },
  {
    name: "cron 스케줄 (매일 09:00 KST)",
    ok: workflowText.includes('cron: "0 0 * * *"') || workflowText.includes("cron: '0 0 * * *'"),
    fix: 'schedule cron "0 0 * * *" (UTC 00:00 = KST 09:00)',
  },
  {
    name: "publish-due-posts.mjs 호출",
    ok: workflowText.includes("publish-due-posts.mjs"),
    fix: "workflow에 node scripts/publish-due-posts.mjs 단계 추가",
  },
  {
    name: "Jekyll 빌드 단계",
    ok: workflowText.includes("jekyll build"),
    fix: "bundle exec jekyll build 단계 추가",
  },
  {
    name: "GitHub Pages deploy 단계",
    ok: workflowText.includes("deploy-pages"),
    fix: "actions/deploy-pages@v4 단계 추가",
  },
  {
    name: "configure-pages 단계",
    ok: workflowText.includes("configure-pages"),
    fix: "actions/configure-pages@v5 단계 추가",
  },
  {
    name: "_posts-pending 폴더 존재",
    ok: fs.existsSync(PENDING),
    fix: "_posts-pending/ 폴더 생성 후 글 추가",
  },
  {
    name: "오늘 날짜 글 존재 (pending 또는 _posts)",
    ok: dueTotal > 0,
    fix: `_posts-pending/${today}-슬러그.md 형식으로 글 추가`,
  },
];

let allOk = true;
for (const c of checks) {
  const mark = c.ok ? "OK" : "FAIL";
  console.log(`[${mark}] ${c.name}`);
  if (!c.ok) {
    console.log(`       → ${c.fix}`);
    allOk = false;
  }
}

console.log("\n=== 발행 흐름 ===");
console.log("1. 매일 09:00 KST → GitHub Actions cron 실행");
console.log("2. publish-due-posts.mjs → 파일명 날짜 ≤ 오늘 → _posts/ 이동");
console.log("3. Jekyll 빌드 → blog/ 목록·글 URL 생성");
console.log("4. GitHub Pages 배포 → pognae.github.io 반영");
console.log("5. git commit → _posts/·pending 변경 저장");

console.log("\n=== 필수 GitHub 설정 ===");
console.log("Settings → Pages → Source: GitHub Actions");
console.log("Settings → Actions → General → Workflow permissions: Read and write");

if (!allOk) process.exit(1);
console.log("\n자동 발행 구조: 정상");
