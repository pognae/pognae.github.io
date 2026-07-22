const axios = require('axios');
const fs = require('fs');
const path = require('path');

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
if (!NVIDIA_API_KEY) {
    console.error('Error: NVIDIA_API_KEY is not set in the environment variables.');
    process.exit(1);
}

const NIM_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'meta/llama-3.1-70b-instruct';

function getCurrentDate() {
    const now = new Date();
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
    return text;
}

function isDuplicatePost(keyword) {
    const slugKeyword = keyword.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().replace(/\s+/g, '-');
    if (!slugKeyword) return true;

    const postsDir = path.join(process.cwd(), '_posts');
    const pendingDir = path.join(process.cwd(), '_posts-pending');

    const checkDir = (dir) => {
        if (!fs.existsSync(dir)) return false;
        const files = fs.readdirSync(dir);
        return files.some(file => file.includes(slugKeyword));
    };

    return checkDir(postsDir) || checkDir(pendingDir);
}

function isValidKeyword(keyword) {
    if (!/[가-힣a-zA-Z0-9]/.test(keyword)) {
        console.log(`Skipping keyword [${keyword}]: Does not contain Korean, English, or numbers.`);
        return false;
    }

    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
        console.log(`Skipping keyword [${keyword}]: Too short or single word.`);
        return false;
    }
    
    const blacklist = [
        '정치', '대통령', '국회', '국회의원', '정당', '여당', '야당', '총선', '대선', '지방선거',
        '탄핵', '검찰', '특검', '장관', '차관', '청와대', '법원', '판사', '검사', '청문회',
        '원내대표', '당대표', '정청래', '한동훈', '이재명', '윤석열', '문재인', '박근혜',
        '이명박', '노무현', '김대중', '김영삼', '조국', '추미애', '심상정', '안철수', '유승민',
        '홍준표', '오세훈', '김동연', '박형준', '이준석', '원희룡', '김기현', '나경원'
    ];
    
    const containsBlacklist = blacklist.some(term => keyword.includes(term));
    if (containsBlacklist) {
        console.log(`Skipping keyword [${keyword}]: Contains sensitive or blacklisted term.`);
        return false;
    }

    if (isDuplicatePost(keyword)) {
        console.log(`Skipping keyword [${keyword}]: Duplicate post already exists.`);
        return false;
    }
    
    return true;
}

function getSoccerTopicKeyword(rawKeyword) {
    const soccerTerms = [
        '축구', '대전', '울산', '전북', '포항', '수원', '서울', '인천', '제주', '강원', '광주',
        'k리그', 'kleague', '손흥민', '이강인', '김민재', '황희찬', '호날두', '메시', '음바페',
        '홀란드', '토트넘', '바이에른', '파리', '맨체스터', '리버풀', '아스널', '첼시', '레알',
        '바르셀로나', 'epl', '프리미어리그', '챔피언스리그', '월드컵', '아시안컵', '국대', '대표팀',
        '경기', '더비', '분석', '전술', '라인업', '골', '어시스트'
    ];
    const lower = rawKeyword.toLowerCase();
    const isSoccer = soccerTerms.some(k => lower.includes(k));
    
    if (!isSoccer) {
        return `${rawKeyword} 경기 분석 및 축구 관전 포인트`;
    }
    return rawKeyword;
}

async function generateBlogPost(rawKeyword) {
    const keyword = getSoccerTopicKeyword(rawKeyword);
    console.log(`Generating soccer technology & match analysis post: [${keyword}] via NVIDIA NIM...`);
    
    const systemPrompt = `당신은 대한민국 대표 축구 전문 에디터이자 스포츠 전술/경기 분석가 'MonoPoint Football'입니다.
당신의 목표는 국내외 축구팬(K리그, 해외축구, 국가대표) 및 검색 사용자들이 깊이 있게 읽을 수 있도록 경기 분석, 팀 전력 비교, 관전 포인트, 핵심 키플레이어 및 전술적 요소를 흥미진진하고 전문성 높게 전달하는 4,000자 이상의 고품질 포스트를 작성하는 것입니다.

[핵심 작성 지침]
1. 타겟 독자: K리그 팬, 해외축구 팬, 경기 일정/결과 검색자(예: 대전 대 울산 등), 축구 관전 포인트를 찾는 시청자.
2. 내용 구성: 경기 배경, 양 팀 최근 폼 및 상대 전적, 전술 맞대결 포인트, 핵심 선수(키플레이어) 역할, 예상 흐름 및 승부처를 풍부하게 작성.
3. 제목 작성 규칙: 경기명, 팀명, 선수명, 전술 명칭 등 축구 핵심 주제만 명확하게 작성 (60자 이내).
4. 절대 금지: "알아두면 유용한 정보", "한눈에 보기", "완벽 정리", "핵심 정리", "총정리", "주요 내용 및 실용 가이드", "알아보자" 등 인공지능 특유의 상투적 템플릿 문구 사용 금지.
5. 정치 관련 내용 0% 예외 없음 절대 금지.`;

    const userPrompt = `주제: "${keyword}"

위 축구 키워드를 바탕으로 축구팬들이 열독할 수 있는 4,000자 이상의 고품질 축구 분석 포스트를 작성해 주세요. 아래 [TITLE], [DESCRIPTION], [BODY] 태그 형식을 정확히 준수하십시오.

[TITLE]
축구 경기명/팀명/선수명 및 핵심 관전 포인트를 담은 명확한 제목 (60자 이내).
(예: "대전 대 울산 K리그 12라운드 경기 분석 및 관전 포인트", "손흥민 토트넘 최신 전술 역할과 기록 분석")

[DESCRIPTION]
검색엔진 메타 디스크립션용 120~150자 축구 전문 요약문.

[BODY]
마크다운 형식의 4,000자 이상 본문.
1. 서론: 해당 축구 경기 또는 키워드의 배경과 축구팬들의 관전 열기 및 주요 관심사 소개.
2. 본론 (H2, H3 헤딩 활용):
   - 팀 전력 비교 및 최근 경기 흐름 (승률, 득실점, 최근 분위기)
   - 주요 선수 맞대결 및 키플레이어 전술 분석
   - 감독의 전략 및 예상 경기 양상과 승부처 포인트
3. 결론: 경기 관전 총평 및 팬들에게 전하는 시청 팁.`;

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
            timeout: 300000
        });

        const rawContent = response.data.choices[0].message.content.trim();
        const content = sanitizeContent(rawContent);
        
        let title = `${keyword} 축구 경기 분석`;
        let description = `${keyword} 관련 팀 전력 분석, 관전 포인트 및 핵심 요소를 종합 안내해 드립니다.`;
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

        console.log('Soccer blog post generated successfully.');
        return { title, description, body };
    } catch (error) {
        console.error('Error calling NVIDIA NIM API:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function savePost(keyword, postData, dateInfo) {
    const { title, description, body } = postData;
    
    const slugKeyword = keyword.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().replace(/\s+/g, '-');
    if (!slugKeyword) {
        console.log(`Skipping save for keyword [${keyword}]: Slug is empty.`);
        return;
    }
    
    const filename = `${dateInfo.dateStr}-${slugKeyword}.md`;
    
    const postsDir = path.join(process.cwd(), '_posts');
    if (!fs.existsSync(postsDir)) {
        fs.mkdirSync(postsDir, { recursive: true });
    }
    
    const filePath = path.join(postsDir, filename);
    
    const frontmatter = `---
layout: post
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
date: ${dateInfo.timeStr}
categories: [축구, 경기분석]
tags: [${keyword}, K리그, 축구]
---

`;

    const fullContent = frontmatter + body;
    
    fs.writeFileSync(filePath, fullContent, 'utf8');
    console.log(`Saved new soccer post to: ${filePath}`);
}

async function main() {
    try {
        const keywords = await scrapeKeyword();
        console.log(`Found ${keywords.length} keywords.`);

        const validKeywords = keywords.filter(isValidKeyword);
        console.log(`Found ${validKeywords.length} valid keywords out of ${keywords.length}.`);

        const keywordsToProcess = validKeywords.slice(0, 5);
        
        for (let i = 0; i < keywordsToProcess.length; i++) {
            const keyword = keywordsToProcess[i];
            console.log(`\n[${i + 1}/${keywordsToProcess.length}] Processing keyword: ${keyword}`);
            
            const dateInfo = getCurrentDate();
            
            try {
                const postContent = await generateBlogPost(keyword);
                await savePost(keyword, postContent, dateInfo);
                console.log(`Successfully completed soccer posting for: ${keyword}`);
                
                if (i < keywordsToProcess.length - 1) {
                    console.log('Waiting 10 seconds before next request...');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
            } catch (err) {
                console.error(`Failed to process keyword ${keyword}:`, err.message);
            }
        }
        console.log('\nAll soccer keywords processed successfully!');
    } catch (error) {
        console.error('Auto posting failed:', error);
        process.exit(1);
    }
}

main();
