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
            const keyword = response.data.data[0];
            const normalizedKeyword = keyword.normalize('NFC');
            console.log(`Successfully extracted keyword from AdsenseFarm: ${normalizedKeyword}`);
            return normalizedKeyword;
        } else {
            throw new Error('Invalid or empty response from API');
        }
    } catch (error) {
        console.error('Failed to fetch from AdsenseFarm API:', error.message);
        console.log('Attempting fallback: Fetching directly from Google Trends RSS (KR)...');
        try {
            const fallbackResponse = await axios.get('https://trends.google.co.kr/trends/trendingsearches/daily/rss?geo=KR', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            // RSS XML에서 첫 번째 실제 키워드 아이템의 title 추출 (첫 번째 title은 채널 제목이므로 두 번째 title 사용)
            const matches = [...fallbackResponse.data.matchAll(/<title>(.*?)<\/title>/g)];
            if (matches && matches.length > 1) {
                const keyword = matches[1][1]; // 인덱스 1이 첫 번째 트렌드 키워드
                const normalizedKeyword = keyword.normalize('NFC').replace(/<!\[CDATA\[(.*?)\]\]>/, '$1');
                console.log(`Successfully extracted keyword from Google Trends Fallback: ${normalizedKeyword}`);
                return normalizedKeyword;
            } else {
                throw new Error('Failed to parse Google Trends RSS');
            }
        } catch (fallbackError) {
            console.error('Fallback failed:', fallbackError.message);
            throw new Error('Failed to extract Google realtime keyword from all sources.');
        }
    }
}

async function generateBlogPost(keyword) {
    console.log(`Generating blog post for keyword: [${keyword}] via NVIDIA NIM...`);
    
    const systemPrompt = `당신은 구글 SEO(검색 엔진 최적화) 블로그 글쓰기 전문가입니다.
독자의 의도를 정확히 파악하여 체류 시간을 늘리고, 검색 상단에 노출될 수 있는 고품질의 정보성 글을 작성합니다.
반드시 모든 문장은 '~합니다', '~입니다' 형태의 정중하고 전문적인 경어체를 사용하십시오.`;

    const userPrompt = `오늘의 핫 트렌드 키워드는 "${keyword}" 입니다.
이 키워드를 메인 주제로 삼아 다음 조건에 맞춰 완벽한 블로그 포스트 마크다운(Markdown) 본문을 작성해 주세요.

[작성 조건]
1. 분량 보장: 매우 상세하고 깊이 있는 정보를 제공하여 **공백 포함 최소 5,000자 이상**의 분량을 확보해야 합니다.
2. 어조: '~합니다', '~입니다'로 끝나는 정중체 사용.
3. 글 구조:
   - 매력적인 서론 (독자의 호기심 유발 및 글의 목적 명시)
   - 본론 (H2(##) 및 H3(###) 소제목을 활용하여 최소 4~5개의 세부 챕터 구성)
   - 자주 묻는 질문(FAQ) 섹션 추가
   - 결론 및 요약
4. SEO 최적화: 자연스러운 키워드 반복, 가독성을 위한 불릿 포인트(-) 및 강조(**볼드**) 적극 활용.
5. 주의: 마크다운 문법으로만 출력하며, 글의 맨 앞이나 뒤에 "네, 알겠습니다" 같은 불필요한 인사말이나 부연 설명은 절대 넣지 마세요. 오직 블로그 본문만 출력하세요.`;

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
            timeout: 120000 // 2분 대기 (글이 길어 생성 시간이 필요함)
        });

        const content = response.data.choices[0].message.content;
        console.log('Blog post generated successfully.');
        return content.trim();
    } catch (error) {
        console.error('Error calling NVIDIA NIM API:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function savePost(keyword, content, dateInfo) {
    // 특수문자 제거 및 띄어쓰기 하이픈 변환 (슬러그용)
    const slugKeyword = keyword.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().replace(/\s+/g, '-');
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
        const dateInfo = getCurrentDate();
        const keyword = await scrapeKeyword();
        const postContent = await generateBlogPost(keyword);
        await savePost(keyword, postContent, dateInfo);
        console.log('Auto posting completed successfully.');
    } catch (err) {
        console.error('Auto posting failed:', err);
        process.exit(1);
    }
}

main();
