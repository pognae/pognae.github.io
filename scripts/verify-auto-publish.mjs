#!/usr/bin/env node
/**
 * 자동 발행 파이프라인 상태 점검 (CI·로컬 공용)
 *
 * CI(CI=true): publish-due-posts 실행 직후 호출 — 오늘 글이 pending에 남으면 실패
 * 로컬: 구조 점검 + 경고만 출력
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PENDING = path.join(ROOT, "_posts-pending");
const POSTS = path.join(ROOT, "_posts");
const WORKFLOW = path.join(ROOT, ".github/workflows/pages.yml");
const TZ = "Asia/Seoul";
const isCI = process.env.CI === "true" || process.argv.includes("--ci");

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

function hasCron(expr) {
  return (
    workflowText.includes(`cron: "${expr}"`) ||
    workflowText.includes(`cron: '${expr}'`)
  );
}

console.log("=== MonPoint 블로그 자동 발행 점검 ===");
console.log(`모드: ${isCI ? "CI (발행 후 검증)" : "로컬"}`);
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
    name: "cron 1차 (매일 09:00 KST)",
    ok: hasCron("0 0 * * *"),
    fix: 'schedule cron "0 0 * * *" (UTC 00:00 = KST 09:00)',
  },
  {
    name: "cron 2차 백업 (매일 15:00 KST)",
    ok: hasCron("0 6 * * *"),
    fix: 'schedule cron "0 6 * * *" (UTC 06:00 = KST 15:00)',
  },
  {
    name: "repository_dispatch (외부 스케줄러)",
    ok: workflowText.includes("repository_dispatch") && workflowText.includes("publish-blog"),
    fix: 'workflow on.repository_dispatch types: [publish-blog] 추가',
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
];

// CI: publish 직후 — 오늘 예정 글이 pending에 남아 있으면 실패
if (isCI && dueTotal > 0) {
  checks.push({
    name: "오늘 글 pending 잔류 없음 (publish 후)",
    ok: duePending.length === 0,
    fix: `오늘 글 ${duePending.length}편이 _posts-pending에 남음 — publish-due-posts.mjs 확인`,
  });
  checks.push({
    name: "오늘 글 _posts 이동 완료",
    ok: duePosts.length > 0,
    fix: `_posts/${today}-*.md 로 이동되지 않음`,
  });
}

// 로컬: 오늘 글이 pending에만 있으면 경고 (아직 cron 미실행)
const warnings = [];
if (!isCI && duePending.length > 0) {
  warnings.push(
    `WARN: 오늘 글 ${duePending.length}편이 아직 _posts-pending에 있습니다. ` +
      "GitHub Actions cron 또는 수동 트리거가 필요합니다."
  );
}
if (!isCI && dueTotal === 0) {
  warnings.push(`INFO: 오늘(${today}) 예정된 글이 없습니다.`);
}

let allOk = true;
for (const c of checks) {
  const mark = c.ok ? "OK" : "FAIL";
  console.log(`[${mark}] ${c.name}`);
  if (!c.ok) {
    console.log(`       → ${c.fix}`);
    allOk = false;
  }
}

for (const w of warnings) {
  console.log(`[${w.startsWith("WARN") ? "WARN" : "INFO"}] ${w}`);
}

console.log("\n=== 발행 흐름 ===");
console.log("1. 매일 09:00·15:00 KST → GitHub Actions cron (2회)");
console.log("2. publish-due-posts.mjs → 파일명 날짜 ≤ 오늘 → _posts/ 이동");
console.log("3. verify → 오늘 글 pending 잔류 시 CI 실패");
console.log("4. Jekyll 빌드 → GitHub Pages 배포");
console.log("5. git commit → _posts/·pending 변경 저장");
console.log("※ 외부 백업: scripts/trigger-publish-remote.mjs (cron-job.org 등)");

console.log("\n=== 필수 GitHub 설정 ===");
console.log("Settings → Pages → Source: GitHub Actions");
console.log("Settings → Actions → General → Workflow permissions: Read and write");

if (!allOk) process.exit(1);
console.log("\n자동 발행 구조: 정상");
