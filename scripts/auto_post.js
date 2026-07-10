const puppeteer = require('puppeteer');
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
    console.log('Starting puppeteer to scrape realtime keywords...');
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new'
    });
    const page = await browser.newPage();
    
    // 빠른 로딩을 위해 이미지/CSS 차단
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
            req.abort();
        } else {
            req.continue();
        }
    });

    await page.goto('https://adsensefarm.kr/realtime/', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 구글 실시간 검색어 1위 추출 로직
    // 사이트 구조에 맞춰 동적으로 추출 (h2 등에서 "구글 실시간 검색어"를 찾고 그 아래 리스트의 첫 항목 가져오기)
    const keyword = await page.evaluate(() => {
        // 모든 텍스트 요소를 순회하면서 "구글 실시간 검색어" 섹션 찾기
        const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4, div'));
        let targetHeader = null;
        for (const el of headers) {
            if (el.innerText && el.innerText.includes('구글 실시간 검색어')) {
                targetHeader = el;
                break;
            }
        }
        
        if (!targetHeader) return null;
        
        // 해당 헤더 다음에 오는 첫 번째 리스트(ul/ol) 또는 리스트 아이템 형태의 텍스트 찾기
        let current = targetHeader.nextElementSibling;
        while (current) {
            // ol/ul 내부의 첫 번째 li
            const firstLi = current.querySelector('li');
            if (firstLi) {
                // "1. 키워드" 또는 "키워드" 형태로 나오는 부분 정제
                return firstLi.innerText.replace(/^[0-9\.\-\s]+/, '').trim();
            }
            // div 안에 텍스트가 줄바꿈으로 있는 경우
            const textLines = current.innerText.split('\n').map(l => l.trim()).filter(l => l);
            if (textLines.length > 0) {
                return textLines[0].replace(/^[0-9\.\-\s]+/, '').trim();
            }
            current = current.nextElementSibling;
        }
        return null;
    });

    await browser.close();
    
    if (!keyword) {
        throw new Error('Failed to extract Google realtime keyword.');
    }
    console.log(`Successfully extracted keyword: ${keyword}`);
    return keyword;
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
