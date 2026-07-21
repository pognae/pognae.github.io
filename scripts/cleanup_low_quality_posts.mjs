import fs from 'fs';
import path from 'path';

const postsDir = path.join(process.cwd(), '_posts');
const files = fs.readdirSync(postsDir);

console.log(`Analyzing ${files.length} posts for quality and templates...`);

let cleanedCount = 0;
let titleFixedCount = 0;

const templatePatterns = [
  /알아두면 유용한 정보/g,
  /완벽 정리/g,
  /한눈에 보기/g,
  /핵심 정리/g,
  /완벽 가이드/g,
  /총정리/g
];

files.forEach(file => {
  if (!file.endsWith('.md')) return;
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const stat = fs.statSync(filePath);

  let needDelete = false;

  // 1. 파일 크기가 너무 작고(3.5KB 미만) 키워드가 1~2자 명사인 경우 (부실한 AI 포스팅)
  if (stat.size < 3500) {
    const slugName = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    if (slugName.length <= 3) {
      console.log(`[LOW QUALITY REMOVAL] Small size (${stat.size}B) & short keyword: ${file}`);
      needDelete = true;
    }
  }

  if (needDelete) {
    fs.unlinkSync(filePath);
    cleanedCount++;
    return;
  }

  // 2. 제목 내 템플릿 상투어 정제
  let newContent = content;
  let hasTitleTemplate = false;

  templatePatterns.forEach(pattern => {
    if (pattern.test(newContent)) {
      hasTitleTemplate = true;
      newContent = newContent.replace(pattern, '주요 내용 및 실용 가이드');
    }
  });

  if (hasTitleTemplate) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    titleFixedCount++;
    console.log(`[TITLE FIXED] ${file}`);
  }
});

console.log(`\nCleanup complete.`);
console.log(`- Low quality posts removed: ${cleanedCount}`);
console.log(`- Titles sanitized: ${titleFixedCount}`);
