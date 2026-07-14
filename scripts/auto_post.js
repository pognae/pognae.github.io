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

function isValidKeyword(keyword) {
    // 1. 러시아어/키릴 문자 등 외국어 전용 검색어 배제 (한국어/영어/숫자가 전혀 포함되지 않은 경우)
    if (!/[가-힣a-zA-Z0-9]/.test(keyword)) {
        console.log(`Skipping keyword [${keyword}]: Does not contain Korean, English, or numbers.`);
        return false;
    }
    
    // 2. 정치 및 민감한 법률/사회적 이슈 관련 키워드 블랙리스트 필터링 (Rule 13 준수)
    const blacklist = [
        '정치', '민주당', '국민의힘', '대통령', '의원', '탄핵', '선거', '뇌물', '비리', 
        '검찰', '재판', '구속', '기소', '시위', '파업', '정부', '장관', '총리', '여당', '야당',
        '윤석열', '이재명', '한동훈', '정당', '국회'
    ];
    
    const containsBlacklist = blacklist.some(term => keyword.includes(term));
    if (containsBlacklist) {
        console.log(`Skipping keyword [${keyword}]: Contains sensitive political/legal term.`);
        return false;
    }
    
    return true;
}

async function generateBlogPost(keyword) {
    console.log(`Generating blog post for keyword: [${keyword}] via NVIDIA NIM...`);
    
    const systemPrompt = `당신은 구글 SEO 전문가이자, 독자와 따뜻하게 소통하는 10년 차 칼럼니스트 '에디터 모노'입니다.
기계적인 정보 나열을 피하고, 실제 본인의 경험담이나 개인적인 통찰을 녹여내어 '진짜 사람이 쓴 글'처럼 작성하는 것이 당신의 핵심 능력입니다.
문체는 너무 딱딱하지 않은 '~합니다', '~입니다', '~할까요?' 형태의 친근하고 신뢰감 있는 경어체를 사용하십시오.
가장 중요한 규칙: 반드시 한국어(Korean)로만 작성해야 합니다. 복수형 접미사는 절대 한자 '們'이 아닌 한글 '들'로만 써야 합니다. 태국어(예: สำค), 일본어(예: 引き起こ, 蝕) 등의 다국어 단어나 문자가 한글 문장 사이에 절대로 섞여 나오지 않도록 주의하십시오.`;

    const userPrompt = `오늘 분석할 핵심 키워드는 "${keyword}" 입니다.
이 키워드를 주제로, 구글 애드센스 심사 담당자가 보아도 '가치 있는 인간의 글'이라고 판단할 수 있도록 다음 조건에 맞춰 마크다운(Markdown) 본문을 작성해 주세요.

[작성 조건]
1. 언어: 반드시 100% 한국어(Korean)로만 작성. (다른 언어 문자 혼입 절대 불가)
2. 분량: 독자의 체류 시간을 극대화할 수 있도록 상세한 정보와 깊이 있는 통찰을 담아 **공백 포함 최소 4,000자 이상** 작성.
3. 인트로 (서론): 전형적인 AI식 서론("오늘은 ~에 대해 알아보겠습니다")을 절대 금지합니다. 대신, "최근 주변 지인들과 이야기하다 보면...", "저 역시 최근 이 문제로 고민이 많았는데요," 와 같이 개인적인 경험이나 최근 사회적 분위기를 환기시키는 공감형 문장으로 시작하세요.
4. 글 구조 (본론): 
   - 기계적인 불릿 포인트 나열을 지양하고, 스토리텔링 방식의 문단 위주로 작성하세요.
   - H2(##), H3(###) 소제목은 질문형이나 감성적인 문구로 구성하세요. (예: "왜 우리는 ~에 열광할까요?", "제가 직접 겪어보고 느낀 장점들")
   - 키워드와 관련된 팁이나 숨겨진 노하우(본인만의 꿀팁 느낌)를 반드시 한 섹션 이상 포함하세요.
5. 아웃트로 (결론): "요약하게", "결론적으로" 같은 AI 특유의 맺음말을 금지합니다. 독자에게 가벼운 질문을 던지거나 따뜻한 응원의 메시지로 자연스럽게 마무리하세요.
6. 주의사항: 글의 앞뒤에 "네, 알겠습니다", "마크다운 형식으로 출력합니다" 같은 불필요한 봇의 응답은 절대 쓰지 마세요. 오직 블로그 본문만 마크다운으로 출력하세요.`;

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

        const content = response.data.choices[0].message.content;
        console.log('Blog post generated successfully.');
        return sanitizeContent(content.trim());
    } catch (error) {
        console.error('Error calling NVIDIA NIM API:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function savePost(keyword, content, dateInfo) {
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
    
    // Jekyll Frontmatter 생성
    const frontmatter = `---
layout: post
title: "${keyword} 완벽 정리! 알아두면 유용한 정보"
date: ${dateInfo.timeStr}
categories: [트렌드, 이슈]
tags: [${keyword}, 실시간검색어, 정보]
---

`;

    const fullContent = frontmatter + content;
    
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
