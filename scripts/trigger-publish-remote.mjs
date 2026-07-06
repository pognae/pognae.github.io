#!/usr/bin/env node
/**
 * 외부 스케줄러(cron-job.org 등)에서 GitHub Actions 발행 워크플로 트리거
 *
 * 사용법:
 *   GITHUB_TOKEN=ghp_xxx node scripts/trigger-publish-remote.mjs
 *
 * 토큰 권한: repo (또는 fine-grained: Actions Read+Write, Contents Read)
 *
 * cron-job.org 설정 예:
 *   URL: https://api.github.com/repos/pognae/pognae.github.io/dispatches
 *   Method: POST
 *   Schedule: 매일 10:00 KST (09:00 cron 백업)
 *   Headers:
 *     Accept: application/vnd.github+json
 *     Authorization: Bearer <GITHUB_TOKEN>
 *     X-GitHub-Api-Version: 2022-11-28
 *   Body: {"event_type":"publish-blog","client_payload":{}}
 */
const REPO = process.env.GITHUB_REPO || "pognae/pognae.github.io";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("GITHUB_TOKEN 환경 변수가 필요합니다.");
  console.error("예: GITHUB_TOKEN=ghp_xxx node scripts/trigger-publish-remote.mjs");
  process.exit(1);
}

const url = `https://api.github.com/repos/${REPO}/dispatches`;
const body = JSON.stringify({
  event_type: "publish-blog",
  client_payload: { source: "external-scheduler", at: new Date().toISOString() },
});

const res = await fetch(url, {
  method: "POST",
  headers: {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  },
  body,
});

if (res.status === 204) {
  console.log(`OK — repository_dispatch 'publish-blog' triggered for ${REPO}`);
  console.log("Actions 탭에서 'Build and deploy site' 실행을 확인하세요.");
  process.exit(0);
}

const text = await res.text();
console.error(`FAIL — HTTP ${res.status}: ${text}`);
process.exit(1);
