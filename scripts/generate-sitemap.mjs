#!/usr/bin/env node
/**
 * Google Search Console용 sitemap.xml 생성
 * - 정적 페이지 + _posts/ 발행 글만 포함 (pending/preview 제외)
 * - CI 빌드 전 실행 → Jekyll이 _site/로 복사
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "_posts");
const OUT = path.join(ROOT, "sitemap.xml");
const BASE = "https://pognae.github.io";

const STATIC_PAGES = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/about.html", changefreq: "monthly", priority: "0.6" },
  { loc: "/privacy.html", changefreq: "monthly", priority: "0.5" },
  { loc: "/contact.html", changefreq: "monthly", priority: "0.5" },
  { loc: "/blog/", changefreq: "weekly", priority: "0.8" }
];

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parsePost(filename) {
  const m = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/);
  if (!m) return null;
  const [, year, month, day, slug] = m;
  return {
    loc: `/blog/${year}/${month}/${day}/${slug}/`,
    lastmod: `${year}-${month}-${day}`
  };
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const lines = [
    "  <url>",
    `    <loc>${escapeXml(BASE + loc)}</loc>`
  ];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push("  </url>");
  return lines.join("\n");
}

const entries = STATIC_PAGES.map((page) =>
  urlEntry({ ...page, lastmod: null })
);

if (fs.existsSync(POSTS_DIR)) {
  const posts = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(parsePost)
    .filter(Boolean)
    .sort((a, b) => b.lastmod.localeCompare(a.lastmod));

  for (const post of posts) {
    entries.push(
      urlEntry({
        loc: post.loc,
        lastmod: post.lastmod,
        changefreq: "monthly",
        priority: "0.6"
      })
    );
  }
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries,
  "</urlset>",
  ""
].join("\n");

fs.writeFileSync(OUT, xml, "utf8");
console.log(`Wrote ${OUT} (${entries.length} URLs)`);
