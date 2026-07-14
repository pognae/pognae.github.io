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
    // 1. 러시아어/키릴 문자 등 외국어 전용 검색어 배제 (한국어/영어/숫자가 전혀 포함되지 않은 경우)
    if (!/[가-힣a-zA-Z0-9]/.test(keyword)) {
        console.log(`Skipping keyword [${keyword}]: Does not contain Korean, English, or numbers.`);
        return false;
    }
    
    // 2. 구글 애드센스 게시자 정책 및 Rule 13 준수 (정치, 민감 법률, 성인물, 마약, 폭력, 도박 등 배제)
    const blacklist = [
        // 정치 관련
        '정치', '민주당', '국민의힘', '대통령', '의원', '탄핵', '선거', '뇌물', '비리', 
        '검찰', '재판', '구속', '기소', '시위', '파업', '정부', '장관', '총리', '여당', '야당',
        '윤석열', '이재명', '한동훈', '정당', '국회', '청와대', '법안',
        // 성인/선정성 관련
        '성인', '야동', '콘돔', '유흥', '섹스', '원나잇', '포르노', '에로',
        // 마약/도박/범죄/무기 관련
        '마약', '대마초', '필로폰', '불법', '사기', '도박', '카지노', '토토', '살인', '자살',
        '자해', '폭력', '무기', '총기', '해킹', '절도', '강도', '피해', '피의자', '혐의',
        // 기타 광고주 비선호/부정적 키워드
        '사망', '참사', '붕괴', '사고', '전쟁', '테러'
    ];
    
    const containsBlacklist = blacklist.some(term => keyword.includes(term));
    if (containsBlacklist) {
        console.log(`Skipping keyword [${keyword}]: Contains sensitive political/legal/policy term.`);
        return false;
    }

    // 3. 중복 포스팅 검사
    if (isDuplicatePost(keyword)) {
        console.log(`Skipping keyword [${keyword}]: Duplicate post already exists in _posts or _posts-pending.`);
        return false;
    }
    
    return true;
}

async function generateBlogPost(keyword) {
    console.log(`Generating blog post for keyword: [${keyword}] via NVIDIA NIM...`);
    
    const systemPrompt = `당신은 구글 SEO 전문가이자, 독자와 따뜻하게 소통하는 10년 차 칼럼니스트 '에디터 모노'입니다.
기계적인 정보 나열을 피하고, 실제 본인의 경험담이나 개인적인 통찰을 녹여내어 '진짜 사람이 쓴 글'처럼 작성하는 것이 당신의 핵심 능력입니다.
문체는 너무 딱딱하지 않은 '~합니다', '~입니다', '~할까요?' 형태의 친근하고 신뢰감 있는 경어체를 사용하십시오.
가장 중요한 규칙: 반드시 한국어(Korean)로만 작성해야 합니다. 복수형 접미사는 절대 한자 '們'이 아닌 한글 '들'로만 써야 합니다. 태국어(예: สำค), 일본어(예: 引き起こ, 蝕) 등의 다국어 단어가 한글 문장 사이에 절대로 섞여 나오지 않도록 주의하십시오.
또한 구글 애드센스 게시자 정책을 100% 준수해야 합니다. 폭력, 마약, 성인물, 도박, 무기류, 불법 행위, 특정 인물 비방, 그리고 정치적 대립이나 논쟁을 유발할 수 있는 민감한 사회적/사법 이슈에 대한 옹호나 비판은 절대로 포함되어서는 안 되며, 오직 일반적이고 건전한 정보 전달 목적의 글만 작성해야 합니다.`;

    const userPrompt = `오늘 분석할 핵심 키워드는 "${keyword}" 입니다.
이 키워드를 주제로, 구글 애드센스 심사 담당자가 보아도 '가치 있는 인간의 글'이라고 판단하고 검색 엔진 노출이 잘 될 수 있도록 다음 조건에 맞춰 [TITLE], [DESCRIPTION], [BODY] 태그를 각각 사용해 답변해 주세요.

[출력 형식]
[TITLE]
여기에 핵심 키워드가 자연스럽게 들어가고 클릭률(CTR)을 높일 수 있는 매력적이고 자연스러운 제목을 60자 이내로 작성하세요. (예: "~하는 방법", "주의해야 할 ~가지", "~의 장단점과 해결책")

[DESCRIPTION]
구글 검색 결과(Meta Description)에 노출될 120~150자 내외의 요약 설명문을 작성하세요. 반드시 핵심 키워드가 한 번 이상 포함되어야 합니다.

[BODY]
여기서부터 공백 포함 4,000자 이상의 풍부한 마크다운 본문을 작성해 주세요. (서론, 본론, 결론 구조 준수)

[작성 조건]
1. 언어: 반드시 100% 한국어(Korean)로만 작성. (다른 언어 문자 혼입 절대 불가)
2. 분량: 독자의 체류 시간을 극대화할 수 있도록 상세한 정보와 깊이 있는 통찰을 담아 본론을 매우 구체적으로 길게 작성.
3. 인트로 (서론): 전형적인 AI식 서론("오늘은 ~에 대해 알아보겠습니다")을 절대 금지합니다. 대신, "최근 주변 지인들과 이야기하다 보면...", "저 역시 최근 이 문제로 고민이 많았는데요," 와 같이 개인적인 경험이나 최근 사회적 분위기를 환기시키는 공감형 문장으로 시작하세요.
4. 글 구조 (본론): 
   - 기계적인 불릿 포인트 나열을 지양하고, 스토리텔링 방식의 문단 위주로 작성하세요.
   - H2(##), H3(###) 소제목은 질문형이나 감성적인 문구로 구성하세요. (예: "왜 우리는 ~에 열광할까요?", "제가 직접 겪어보고 느낀 장점들")
   - 키워드와 관련된 팁이나 숨겨진 노하우(본인만의 꿀팁 느낌)를 반드시 한 섹션 이상 포함하세요.
5. 아웃트로 (결론): "요약하게", "결론적으로" 같은 AI 특유의 맺음말을 금지합니다. 독자에게 가벼운 질문을 던지거나 따뜻한 응원의 메시지로 자연스럽게 마무리하세요.
6. 주의사항: 글의 앞뒤에 "네, 알겠습니다", "마크다운 형식으로 출력합니다" 같은 불필요한 봇의 응답은 절대 쓰지 마세요.`;

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
            timeout: 300000 // 5분 대기 (글이 길어 생성 시간이 오래 걸릴 수 있음)
        });

        const rawContent = response.data.choices[0].message.content.trim();
        const content = sanitizeContent(rawContent);
        
        let title = `${keyword} 완벽 정리! 알아두면 유용한 정보`;
        let description = `${keyword}에 대해 쉽고 유용한 생활 정보, 필수 가이드, 꿀팁들을 모아 완벽하게 정리하여 알려드립니다.`;
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
