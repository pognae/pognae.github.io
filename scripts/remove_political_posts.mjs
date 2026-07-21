import fs from 'fs';
import path from 'path';

const postsDir = path.join(process.cwd(), '_posts');
const files = fs.readdirSync(postsDir);

console.log(`Scanning ${files.length} posts for political content and politicians...`);

const politicalKeywords = [
  '정치', '민주당', '국민의힘', '조국혁신당', '개혁신당', '진보당', '정당', '대통령', '의원', '국회의원',
  '탄핵', '선거', '공천', '뇌물', '비리', '검찰', '재판', '구속', '기소', '시위', '파업', '정부', '장관',
  '총리', '여당', '야당', '국회', '청와대', '대통령실', '용산', '법안', '청문회', '당대표', '최고위원',
  '윤석열', '이재명', '한동훈', '문재인', '박근혜', '이명박', '노무현', '조국', '추미애', '정청래',
  '안철수', '홍준표', '오세훈', '권성동', '김동연', '유승민', '이준석', '김기현', '원희룡', '정점식',
  '유병호', '송영길', '나경원', '박찬대', '추경호', '김어준', '김진표', '우원식', '순천시장', '원내대표'
];

let removedCount = 0;

files.forEach(file => {
  if (!file.endsWith('.md')) return;
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // 파일명 또는 포스트 내용에서 정치 관련 키워드 감지
  const isPolitical = politicalKeywords.some(keyword => {
    // 파일명 감지
    if (file.includes(keyword)) return true;

    // 제목/Frontmatter 감지
    const frontmatterMatch = content.match(/---([\s\S]*?)---/);
    if (frontmatterMatch && frontmatterMatch[1].includes(keyword)) return true;

    return false;
  });

  if (isPolitical) {
    console.log(`[POLITICAL POST REMOVED] ${file}`);
    fs.unlinkSync(filePath);
    removedCount++;
  }
});

console.log(`\nPolitical content scan complete.`);
console.log(`- Removed political posts count: ${removedCount}`);
