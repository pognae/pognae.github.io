import fs from 'fs';
import path from 'path';

const postsDir = path.join(process.cwd(), '_posts');
const files = fs.readdirSync(postsDir);

const politicalKeywords = [
  '대통령', '국회의원', '민주당', '국민의힘', '정당', '탄핵', '공천', '비상대책'
];

let removedCount = 0;

files.forEach(file => {
  if (!file.endsWith('.md')) return;
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  let matchCount = 0;
  politicalKeywords.forEach(kw => {
    const matches = content.match(new RegExp(kw, 'g'));
    if (matches) matchCount += matches.length;
  });

  if (matchCount >= 2) {
    console.log(`[DEEP POLITICAL REMOVED] ${file} (matches: ${matchCount})`);
    fs.unlinkSync(filePath);
    removedCount++;
  }
});

console.log(`Deep scan complete. Removed: ${removedCount}`);
