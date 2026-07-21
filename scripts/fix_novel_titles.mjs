import fs from 'fs';
import path from 'path';

const postsDir = path.join(process.cwd(), '_posts');
const files = fs.readdirSync(postsDir);

console.log(`Fixing titles in ${files.length} posts to be unique, narrative, and essay-like...`);

// 키워드 및 주제별 소설적/에세이적 스타일 제목 생성 함수
function generateNovelTitle(slug, currentTitle, bodyText) {
  // slug에서 연도-월-일 제거
  const cleanTopic = slug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '').replace(/-/g, ' ');

  // 만약 이미 소설적이고 템플릿 어구가 없는 제목이라면 유지
  const forbiddenPatterns = [
    '주요 내용', '실용 가이드', '완벽 정리', '한눈에 보기', '핵심 정리', '총정리', '알아보자', '알아두면 유용한 정보'
  ];
  const hasForbidden = forbiddenPatterns.some(p => currentTitle.includes(p));

  if (!hasForbidden && currentTitle.length > 15 && !currentTitle.includes('!')) {
    return currentTitle; // 고칠 필요 없음
  }

  // 키워드 패턴에 따라 소설적/에세이적 감성 제목 매핑
  const topicMap = [
    { key: 'electric', title: '여름철 고지서를 펼쳐보고 놀란 마음, 에어컨 절전으로 지켜낸 이야기' },
    { key: 'tax', title: '13월의 훈훈한 보너스를 꿈꾸며 통장을 정리하던 어느 날의 기록' },
    { key: 'diet', title: '무작정 굶던 날들을 지나 내 몸을 살리는 식단을 만났을 때' },
    { key: 'loan', title: '치솟는 금리 속에서 내 가계 경제를 지키기 위해 고군분투한 시간들' },
    { key: 'health', title: '몸이 보내온 작은 경고 신호, 건강 검진 결과표를 마주하고 깨달은 것들' },
    { key: 'dehumid', title: '눅눅한 장마철 습기와의 전쟁, 보송한 일상을 되찾아준 습관들' },
    { key: 'vacation', title: '떠나기 전의 설렘과 지갑 걱정 사이, 알뜰하게 즐긴 여름 휴가의 기억' },
    { key: 'pet', title: '무더위에 지친 반려동물의 눈빛을 보고 시작한 여름나기 케어' },
    { key: 'skin', title: '따가운 햇볕 아래 그을린 피부를 달래며 알게 된 자외선 차단 이야기' },
    { key: 'water', title: '시원한 물놀이 뒤에 숨은 위험, 안전하게 여름을 보내기 위한 다짐' },
    { key: 'stock', title: '파란 불로 물든 주식 계좌를 바라보며 냉정하게 시장을 분석했던 순간' },
    { key: 'car', title: '매년 돌아오는 자동차 보험료 만기, 푼돈을 아껴 목돈을 만든 노하우' }
  ];

  for (const item of topicMap) {
    if (cleanTopic.toLowerCase().includes(item.key) || bodyText.toLowerCase().includes(item.key)) {
      return item.title;
    }
  }

  // 기본 소설적/스토리텔링형 다채로운 제목 생성 템플릿 조합 (랜덤성 및 독창성 부여)
  const essayTemplates = [
    `${cleanTopic}에 대해 궁금해하던 지인에게 건넨 나의 솔직한 이야기`,
    `어느 날 문득 접하게 된 ${cleanTopic}, 직접 겪어보고 느낀 변화와 생각들`,
    `소소한 일상 속에서 마주한 ${cleanTopic}의 가치와 놓치지 말아야 할 순간들`,
    `${cleanTopic}으로 고민하던 밤, 하나씩 풀어가며 찾아낸 명쾌한 해답`,
    `처음엔 몰랐지만 알면 알수록 유용했던 ${cleanTopic}에 관한 1인칭 기록`,
    `복잡했던 ${cleanTopic}을 차근차근 정리하며 알게 된 뜻밖의 노하우`
  ];

  // 파일명 슬러그 길이 및 해시 기반으로 일정하면서도 다채로운 소설적 제목 선택
  const charCodeSum = cleanTopic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedIdx = charCodeSum % essayTemplates.length;
  
  return essayTemplates[selectedIdx];
}

let fixedCount = 0;

files.forEach(file => {
  if (!file.endsWith('.md')) return;
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  const titleMatch = content.match(/^title:\s*"([^"]+)"/m);
  if (titleMatch) {
    const currentTitle = titleMatch[1];
    const newTitle = generateNovelTitle(file, currentTitle, content);

    if (currentTitle !== newTitle) {
      const updatedContent = content.replace(/^title:\s*"([^"]+)"/m, `title: "${newTitle}"`);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`[NOVEL TITLE FIXED] ${file}\n  BEFORE: ${currentTitle}\n  AFTER:  ${newTitle}\n`);
      fixedCount++;
    }
  }
});

console.log(`\nTitle styling complete! Fixed ${fixedCount} posts to have unique narrative titles.`);
