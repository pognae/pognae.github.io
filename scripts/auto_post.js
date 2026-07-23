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

function isSoccerKeyword(keyword) {
    const soccerTerms = [
        '축구', '대전', '울산', '전북', '포항', '수원', '서울', '인천', '제주', '강원', '광주',
        'k리그', 'kleague', '손흥민', '이강인', '김민재', '황희찬', '호날두', '메시', '음바페',
        '홀란드', '토트넘', '바이에른', '파리', '맨체스터', '리버풀', '아스널', '첼시', '레알',
        '바르셀로나', 'epl', '프리미어리그', '챔피언스리그', '월드컵', '아시안컵', '국대', '대표팀',
        '경기', '더비', '분석', '전술', '라인업', '골', '어시스트', 'k-리그', 'k 리그'
    ];
    const lower = keyword.toLowerCase();
    return soccerTerms.some(k => lower.includes(k));
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

    if (!isSoccerKeyword(keyword)) {
        console.log(`Skipping keyword [${keyword}]: Not related to soccer.`);
        return false;
    }

    if (isDuplicatePost(keyword)) {
        console.log(`Skipping keyword [${keyword}]: Duplicate post already exists.`);
        return false;
    }
    
    return true;
}

function getSoccerTopicKeyword(rawKeyword) {
    return rawKeyword;
}

async function generateBlogPost(rawKeyword) {
    const keyword = getSoccerTopicKeyword(rawKeyword);
    console.log(`Generating professional soccer match analysis post: [${keyword}] via NVIDIA NIM...`);
    
    const systemPrompt = `당신은 30년 경력의 베테랑 스포츠 전문 축구 해설위원이자 전술 분석가 'MonoPoint Football'입니다.
당신의 목표는 축구 팬(K리그, 해외축구, 국가대표팀)들이 깊이 읽고 감탄할 수 있도록, 지루한 나열식 글이 아닌 마치 현장감 넘치는 전문 해설과 깊은 전술적 혜안이 돋보이는 4,000자 이상의 고품질 포스트를 작성하는 것입니다.

[핵심 작성 및 신뢰성 지침 (구글 E-E-A-T 준수)]
1. 실제 축구 역사와 상식 준수: 절대 축구 외의 인물(예: 피겨 차준환 등)을 축구 선수로 묘사하거나, 실제 K리그/해외축구에 존재하지 않는 허구의 팀(예: K리그2 의성군 등), 존재하지 않는 가상의 매치업, 허구의 감독/선수 이름을 지어내어 거짓 사실을 작성해서는 안 됩니다. 사실에 기반한 실제 정보만을 서술해야 합니다.
2. 해설자다운 문체와 톤앤매너: 30년 경력의 연륜이 묻어나는 자연스럽고 전문적인 한국어 문체(하십시오체와 해요체를 적절히 융합하여 스포츠 매거진 칼럼처럼 서술)를 사용하십시오.
3. 깊이 있는 전술 분석: 단순히 "이 팀은 잘합니다"가 아닌 포메이션(예: 3-4-3 하이브리드 빌드업), 하프스페이스(Half-space) 장악, 인버티드 풀백의 위치 선정, 전환 패스 비율, 압박 페이즈(Phase) 등 전문적인 축구 전술 용어와 세부 상황을 흥미진진하게 풀어 서술해 주세요.
4. 절대 사용 금지 상투적 어구 (애드센스 필터링 우회):
   - 제목이나 본문에 "알아두면 유용한 정보", "한눈에 보기", "완벽 정리", "핵심 정리", "총정리", "주요 내용 및 실용 가이드", "알아보자", "살펴보자", "소개해 드립니다" 등 인공지능이 쓴 느낌을 주는 템플릿성 멘트를 절대 사용하지 마십시오.
   - 글의 끝에 "이 글이 도움이 되셨기를 바랍니다", "더 많은 소식은 다음 글에서 만나요" 등의 상투적인 기계적 마무리를 하지 말고, 해설가의 날카로운 경기 요약 및 한 줄 전망으로 칼럼을 깔끔하게 마무리하십시오.
5. 정치 관련 내용 0% 예외 없음 절대 금지.`;

    const userPrompt = `주제: "${keyword}"

위 축구 주제에 대하여 30년 차 베테랑 축구 해설가의 시각에서 통찰력 있는 4,000자 이상의 경기 전술/칼럼 포스트를 작성해 주세요. 아래 [TITLE], [DESCRIPTION], [BODY] 태그 형식을 정확히 준수하십시오.

[TITLE]
축구 경기명/팀명/선수명 및 핵심 주제 명칭 위주로 깔끔하게 구성한 제목 (60자 이내, 마크다운 기호 금지).
(예: "대전 대 울산 K리그 12라운드 전술 맞대결 관전 포인트", "손흥민 토트넘 홋스퍼에서의 새로운 윙포워드 전술 역할 분석")

[DESCRIPTION]
검색엔진 메타 디스크립션용 120~150자 축구 칼럼 요약문 (마크다운 기호 금지).

[BODY]
마크다운 형식의 4,000자 이상 본문.
1. 도입부: 해당 경기/선수 주제의 전술적 의미와 축구계 흐름 속 비중 소개. (AI 특유의 상투적 오프닝 탈피)
2. 전술적 분석 (H2, H3 헤딩 활용):
   - 팀들의 최근 전술 트렌드, 포메이션 유기적 변화
   - 양 팀의 메인 빌드업 패턴 및 수비 블록 위치 설정 분석
   - 키플레이어 간 매치업 분석 및 공간 극대화 전략
3. 감독의 지략 대결 및 예상 경기 전개: 감독 간 전술적 상성, 승부를 가를 세부 전술 조커 활용 전략
4. 결론: 베테랑 해설자의 최종 전망 및 이 경기가 시즌 전체에 미칠 영향 요약.`;

    try {
        let response;
        let retries = 3;
        let delay = 10000;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`Sending API request to NIM... (Attempt ${attempt}/${retries})`);
                response = await axios.post(NIM_API_URL, {
                    model: MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 2500,
                }, {
                    headers: {
                        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 90000
                });
                break;
            } catch (err) {
                console.error(`API call failed (Attempt ${attempt}):`, err.message);
                if (attempt === retries) {
                    throw err;
                }
                console.log(`Waiting ${delay / 1000}s before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 1.5;
            }
        }

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

        // Clean markdown and newlines from title/description
        title = title.replace(/\*\*/g, '').replace(/\*/g, '').replace(/[`#_~]/g, '').replace(/[\r\n]+/g, ' ').trim().replace(/\s+/g, ' ');
        description = description.replace(/\*\*/g, '').replace(/\*/g, '').replace(/[`#_~]/g, '').replace(/[\r\n]+/g, ' ').trim().replace(/\s+/g, ' ');

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

if (require.main === module) {
    main();
}

module.exports = {
    generateBlogPost,
    savePost,
    getCurrentDate
};
