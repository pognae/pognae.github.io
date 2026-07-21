const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 설정
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
if (!NVIDIA_API_KEY) {
    console.error('Error: NVIDIA_API_KEY is not set in the environment variables.');
    process.exit(1);
}

const NIM_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'meta/llama-3.1-70b-instruct'; // NVIDIA NIM에서 제공하는 Llama-3.1 모델

// 현재 시간 포맷 (KST 기준)
function getCurrentDate() {
    const now = new Date();
    // KST 시간 보정 (UTC + 9)
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    const yyyy = kst.getUTCFullYear();
    const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(kst.getUTCDate()).padStart(2, '0');
    
    const hh = String(kst.getUTCHours()).padStart(2, '0');
    const min = String(kst.getUTCMinutes()).padStart(2, '0');
    const ss = String(kst.getUTCSeconds()).padStart(2, '0');
    
    return {
        dateStr: `${yyyy}-${mm}-${dd}`,
        timeStr: `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} +0900`,
        year: yyyy,
        month: mm,
        day: dd
    };
}

async function scrapeKeyword() {
    console.log('Fetching realtime keywords from API...');
    try {
        const response = await axios.get('https://adsensefarm.kr/realtime/googletrend.php', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://adsensefarm.kr/realtime/',
                'X-Requested-With': 'XMLHttpRequest',
                'Connection': 'keep-alive'
            }
        });
        if (response.data && response.data.result === 'success' && response.data.data && response.data.data.length > 0) {
            // AdsenseFarm 10개 키워드 배열로 반환
            const keywords = response.data.data.map(k => k.normalize('NFC'));
            console.log(`Successfully extracted ${keywords.length} keywords from AdsenseFarm`);
            return keywords;
        } else {
            throw new Error('Invalid or empty response from API');
        }
    } catch (error) {
        console.error('Failed to fetch from AdsenseFarm API:', error.message);
        console.log('Attempting fallback: Fetching directly from Google Trends RSS (KR)...');
        try {
            const fallbackResponse = await axios.get('https://trends.google.com/trending/rss?geo=KR', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            // RSS XML에서 상위 10개 키워드 추출
            const matches = [...fallbackResponse.data.matchAll(/<title>(.*?)<\/title>/g)].slice(1, 11);
            if (matches && matches.length > 0) {
                const keywords = matches.map(m => m[1].normalize('NFC').replace(/<!\[CDATA\[(.*?)\]\]>/, '$1'));
                console.log(`Successfully extracted ${keywords.length} keywords from Google Trends Fallback`);
                return keywords;
            } else {
                throw new Error('Failed to parse Google Trends RSS');
            }
        } catch (fallbackError) {
            console.error('Fallback failed:', fallbackError.message);
            throw new Error('Failed to extract Google realtime keyword from all sources.');
        }
    }
}

function sanitizeContent(text) {
    if (!text) return text;
    return text
        .replace(/們/g, '들')
        .replace(/引き起こ/g, '일으키')
        .replace(/蝕いる/g, '좀먹는')
        .replace(/蝕む/g, '좀먹는')
        .replace(/蝕/g, '좀먹')
        .replace(/요/g, '요')
        .replace(/สำค한/g, '중요한')
        .replace(/สำค/g, '중요');
}

function isDuplicatePost(keyword) {
    const slugKeyword = keyword.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().replace(/\s+/g, '-');
    if (!slugKeyword) return true; // 빈 슬러그는 중복/무효 처리

    const postsDir = path.join(process.cwd(), '_posts');
    const pendingDir = path.join(process.cwd(), '_posts-pending');

    const checkDir = (dir) => {
        if (!fs.existsSync(dir)) return false;
        const files = fs.readdirSync(dir);
        // 이미 해당 키워드의 슬러그로 끝나는 파일이 존재하는지 검사 (예: *-slugKeyword.md)
        return files.some(file => file.endsWith(`-${slugKeyword}.md`));
    };

    return checkDir(postsDir) || checkDir(pendingDir);
}

function isValidKeyword(keyword) {
    // 1. 한국어/영어/숫자가 전혀 포함되지 않은 검색어 배제
    if (!/[가-힣a-zA-Z0-9]/.test(keyword)) {
        console.log(`Skipping keyword [${keyword}]: Does not contain Korean, English, or numbers.`);
        return false;
    }

    // 2. 단편적 단어(2자 이하 단순 단어) 배제 - 저품질/맥락 없는 AI 포스팅 원천 차단
    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
        console.log(`Skipping keyword [${keyword}]: Too short or single word lacking search intent.`);
        return false;
    }
    
    // 3. 구글 애드센스 게시자 정책 및 Rule 13 준수 (정치인/정치적 이슈 100% 절대 배제)
    const blacklist = [
        // 정치 관련 기관/직책/행위
        '정치', '민주당', '국민의힘', '조국혁신당', '개혁신당', '진보당', '정당', '대통령', '의원', '국회의원',
        '탄핵', '선거', '공천', '뇌물', '비리', '검찰', '재판', '구속', '기소', '시위', '파업', '정부', '장관',
        '총리', '여당', '야당', '국회', '청와대', '대통령실', '용산', '법안', '청문회', '당대표', '최고위원',
        // 주요 정치인 이름 (전/현직)
        '윤석열', '이재명', '한동훈', '문재인', '박근혜', '이명박', '노무현', '조국', '추미애', '정청래',
        '안철수', '홍준표', '오세훈', '권성동', '김동연', '유승민', '이준석', '김기현', '원희룡', '정점식',
        '유병호', '송영길', '나경원', '박찬대', '추경호', '김어준', '김진표', '우원식', '순천시장',
        // 성인/선정성 관련

        '성인', '야동', '콘돔', '유흥', '섹스', '원나잇', '포르노', '에로',
        // 마약/도박/범죄/무기 관련
        '마약', '대마초', '필로폰', '불법', '사기', '도박', '카지노', '토토', '살인', '자살',
        '자해', '폭력', '무기', '총기', '해킹', '절도', '강도', '피해', '피의자', '혐의',
        // 기타 광고주 비선호/부정적 키워드 및 단편 저품질 명사
        '사망', '참사', '붕괴', '사고', '전쟁', '테러', '죽음', '약', '회사'
    ];
    
    const containsBlacklist = blacklist.some(term => keyword.includes(term));
    if (containsBlacklist) {
        console.log(`Skipping keyword [${keyword}]: Contains sensitive political/legal/policy or low-quality term.`);
        return false;
    }

    // 4. 중복 포스팅 검사
    if (isDuplicatePost(keyword)) {
        console.log(`Skipping keyword [${keyword}]: Duplicate post already exists in _posts or _posts-pending.`);
        return false;
    }
    
    return true;
}

async function generateBlogPost(keyword) {
    console.log(`Generating high-quality blog post for keyword: [${keyword}] via NVIDIA NIM...`);
    
    const systemPrompt = `당신은 10년 차 IT/금융/생활 실용 정보 전문 라이터이자 독자의 궁금증을 명쾌하게 풀어주는 저널리스트 '에디터 모노'입니다.
당신의 목표는 구글 애드센스 저품질/자동생성 판정을 절대 받지 않는 '진짜 사람이 쓴 정성스러운 오리지널 포스트'를 작성하는 것입니다.

[엄격 금지 사항]
1. 템플릿적 어구 일체 사용 금지: 제목이나 본문에 "알아두면 유용한 정보", "한눈에 보기", "완벽 정리", "핵심 정리", "완벽 가이드", "총정리", "알아보자", "알아보겠습니다", "필수 가이드" 같은 기계적이고 상투적인 패턴 어구를 절대 포함하지 마십시오.
2. AI 특유의 서론/결론 패턴 금지: "오늘은 ~에 대해 알아보겠습니다", "결론적으로", "요약하자면" 같은 인공지능 상투어를 절대 금지합니다.
3. 기계적 직역 및 타 국어 혼입 금지: 100% 한글로만 작성하고, 한자 '們' 대신 '들'을 사용하십시오.

[작성 지침]
1. 톤앤매너: 친근하면서도 정확한 통찰을 전하는 전문 에디터의 경어체(~합니다, ~입니다, ~일까요?) 사용.
2. E-E-A-T 반영: 필자의 1인칭 실제 경험 및 체험담("제가 직접 신청하며 느꼈던 팁", "이 부분을 미리 준비하지 않아 당황했던 경험")을 자연스럽게 포함하고, 국세청, 보건복지부, 금융감독원, 정부24 등 공식 신뢰 기관의 지침과 출처를 구체적으로 언급하십시오.
3. 제목 스타일: 천편일률적인 정형화 제목이 아닌, 독자의 관심과 실질적인 유익을 유발하는 자연스러운 저널리즘 헤드라인 스타일로 작성하십시오.`;

    const userPrompt = `주제 키워드: "${keyword}"

위 키워드에 대해 독자에게 실질적인 도움을 주는 고품질 글을 작성해 주세요. 아래 [TITLE], [DESCRIPTION], [BODY] 태그 구성을 준수하십시오.

[TITLE]
핵심 키워드가 자연스럽게 어우러지는 매력적이고 구체적인 제목 (60자 이내).
※ "알아두면 유용한 정보", "한눈에 보기", "완벽 정리", "핵심 정리", "총정리" 같은 상투적 템플릿 문구는 절대로 쓰지 마십시오! 독자의 상황이나 질문에 답하는 자연스러운 제목을 쓰세요. (예: "${keyword} 이용 시 놓치기 쉬운 주요 체크포인트 3가지", "${keyword} 실제 적용 후기와 주의할 점")

[DESCRIPTION]
구글 검색 요약(Meta Description)으로 사용될 120~150자 내외의 자연스러운 설명문. 핵심 키워드를 포함하되 템플릿 상투어를 피하십시오.

[BODY]
공백 포함 4,000자 이상의 밀도 높은 본문 (마크다운 포맷).
1. 서론: AI식 인사말("안녕하세요, 오늘은 ~에 대해 알아봅니다") 대신, 최근 본인이 겪은 경험이나 지인의 고민 등 생생한 1인칭 에피소드로 읽는 재미를 유도하며 시작하세요.
2. 본론 소제목(H2, H3): "왜 ~가 중요할까요?", "실제 경험을 통해 알게 된 핵심 노하우" 처럼 질문형이나 감성적 문구로 구성하고, 마크다운 위아래 빈 줄을 반드시 두세요.
3. 경험 & 정보 출처: 1인칭 경험담 섹션을 최소 1개 이상 넣고, 보건복지부/국세청/정부24 등 공신력 있는 기관 서비스와 기준을 구체적으로 설명하십시오.
4. 결론: "결론적으로", "요약하자면" 문구를 쓰지 말고, 독자에게 도움이 되는 따뜻한 조언이나 생각할 거리를 던지며 마무리하세요.`;

    try {
        const response = await axios.post(NIM_API_URL, {
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 4000,
        }, {
            headers: {
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 300000 // 5분 대기
        });

        const rawContent = response.data.choices[0].message.content.trim();
        const content = sanitizeContent(rawContent);
        
        let title = `${keyword} 관련 주요 내용과 실용 팁`;
        let description = `${keyword}에 대해 꼭 알아두어야 할 실용적인 정보와 주요 체크포인트를 상세히 정리해 드립니다.`;
        let body = content;


        const titleMatch = content.match(/\[TITLE\]\s*(.*?)\s*\[DESCRIPTION\]/s);
        const descMatch = content.match(/\[DESCRIPTION\]\s*(.*?)\s*\[BODY\]/s);
        const bodyMatch = content.match(/\[BODY\]\s*(.*)/s);

        if (titleMatch && descMatch && bodyMatch) {
            title = titleMatch[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
            description = descMatch[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
            body = bodyMatch[1].trim();
        } else {
            console.log('Structured parser failed. Trying regex fallbacks...');
            const tMatch = content.match(/\[TITLE\]\s*(.*)/i);
            const dMatch = content.match(/\[DESCRIPTION\]\s*(.*)/i);
            const bMatch = content.match(/\[BODY\]\s*(.*)/i);
            
            if (tMatch) title = tMatch[1].split('\n')[0].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
            if (dMatch) description = dMatch[1].split('\n')[0].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
            if (bMatch) body = bMatch[1].trim();
        }

        console.log('Blog post generated successfully.');
        return { title, description, body };
    } catch (error) {
        console.error('Error calling NVIDIA NIM API:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function savePost(keyword, postData, dateInfo) {
    const { title, description, body } = postData;
    
    // 특수문자 제거 및 띄어쓰기 하이픈 변환 (슬러그용)
    const slugKeyword = keyword.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().replace(/\s+/g, '-');
    if (!slugKeyword) {
        console.log(`Skipping save for keyword [${keyword}]: Slug is empty.`);
        return;
    }
    
    const filename = `${dateInfo.dateStr}-${slugKeyword}.md`;
    
    // 포스트 디렉토리 확인
    const postsDir = path.join(process.cwd(), '_posts');
    if (!fs.existsSync(postsDir)) {
        fs.mkdirSync(postsDir, { recursive: true });
    }
    
    const filePath = path.join(postsDir, filename);
    
    // Jekyll Frontmatter 생성 (description 추가로 검색엔진 미리보기 최적화)
    const frontmatter = `---
layout: post
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
date: ${dateInfo.timeStr}
categories: [트렌드, 이슈]
tags: [${keyword}, 실시간검색어, 정보]
---

`;

    const fullContent = frontmatter + body;
    
    fs.writeFileSync(filePath, fullContent, 'utf8');
    console.log(`Saved new post to: ${filePath}`);
}

async function main() {
    try {
        const keywords = await scrapeKeyword(); // Now returns an array of keywords
        console.log(`Found ${keywords.length} keywords.`);

        // 유효한 키워드만 필터링
        const validKeywords = keywords.filter(isValidKeyword);
        console.log(`Found ${validKeywords.length} valid keywords out of ${keywords.length}.`);

        // Rule 11에 맞춰 구글 트랜드 1~5위까지 총 5개 자동 발행
        const keywordsToProcess = validKeywords.slice(0, 5);
        
        for (let i = 0; i < keywordsToProcess.length; i++) {
            const keyword = keywordsToProcess[i];
            console.log(`\n[${i + 1}/${keywordsToProcess.length}] Processing keyword: ${keyword}`);
            
            // Generate distinct date info for each post to prevent identical timestamps
            const dateInfo = getCurrentDate();
            
            try {
                const postContent = await generateBlogPost(keyword);
                await savePost(keyword, postContent, dateInfo);
                console.log(`Successfully completed posting for: ${keyword}`);
                
                // Add a 10 second delay between requests to avoid rate limiting
                if (i < keywordsToProcess.length - 1) {
                    console.log('Waiting 10 seconds before next request...');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
            } catch (err) {
                console.error(`Failed to process keyword ${keyword}:`, err.message);
                // Continue with the next keyword even if one fails
            }
        }
        console.log('\nAll keywords processed successfully!');
    } catch (error) {
        console.error('Auto posting failed:', error);
        process.exit(1);
    }
}

main();
