const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3000;
const POSTS_DIR = path.join(__dirname, '../_posts');

const server = http.createServer((req, res) => {
    // CORS 헤더
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    // 1. 관리자 페이지 렌더링
    if (url.pathname === '/' || url.pathname === '/admin' || url.pathname === '/admin.html') {
        const adminPath = path.join(__dirname, '../admin.html');
        if (fs.existsSync(adminPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(fs.readFileSync(adminPath, 'utf8'));
        } else {
            res.writeHead(404);
            res.end('admin.html not found');
        }
        return;
    }

    // 2. API: 포스트 목록 조회
    if (url.pathname === '/api/posts' && req.method === 'GET') {
        try {
            const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')).reverse();
            const postsList = files.map(f => {
                const stat = fs.statSync(path.join(POSTS_DIR, f));
                return {
                    name: f,
                    path: `_posts/${f}`,
                    size: stat.size,
                    sha: 'local'
                };
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(postsList));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // 3. API: 포스트 내용 조회
    if (url.pathname.startsWith('/api/post/') && req.method === 'GET') {
        const fileName = decodeURIComponent(url.pathname.replace('/api/post/', ''));
        const filePath = path.join(POSTS_DIR, fileName);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ name: fileName, content: content }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
        }
        return;
    }

    // 4. API: 포스트 수정/저장
    if (url.pathname.startsWith('/api/post/') && req.method === 'PUT') {
        const fileName = decodeURIComponent(url.pathname.replace('/api/post/', ''));
        const filePath = path.join(POSTS_DIR, fileName);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                fs.writeFileSync(filePath, data.content, 'utf8');
                
                // 사이트맵 재생성
                execSync('node scripts/generate-sitemap.mjs', { cwd: path.join(__dirname, '..') });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Updated & sitemap regenerated' }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // 5. API: 포스트 삭제
    if (url.pathname.startsWith('/api/post/') && req.method === 'DELETE') {
        const fileName = decodeURIComponent(url.pathname.replace('/api/post/', ''));
        const filePath = path.join(POSTS_DIR, fileName);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                
                // 사이트맵 재생성
                execSync('node scripts/generate-sitemap.mjs', { cwd: path.join(__dirname, '..') });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Deleted & sitemap regenerated' }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
        }
        return;
    }

    // 6. API: AI 포스트 초안 생성 (NVIDIA NIM Llama-3.1 70B 모델 호출)
    if (url.pathname === '/api/generate-ai-draft' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => bodyStr += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(bodyStr || '{}');
                const keyword = (data.keyword || '').trim();
                const apiKey = (data.apiKey || process.env.NVIDIA_API_KEY || '').trim();

                if (!keyword) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '키워드(주제)를 입력해주세요.' }));
                    return;
                }
                if (!apiKey) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'NVIDIA API Key가 설정되지 않았습니다. API Key를 입력하세요.' }));
                    return;
                }

                const systemPrompt = `너는 AI(인공지능) 최신 기술 및 트렌드 전문 에디터이다.
[작성 지침]
1. 타겟 독자: AI를 배우려는 비전공자 및 비개발자 (어려운 소스 코드나 수식 대신 직관적인 비유와 실용적 예시 위주).
2. 콘텐츠 방향: 최신 AI 기술, AI 도구 활용법, 트렌드 및 향후 동향 설명.
3. 제목 규칙: 관련 기술명 및 핵심 주제명만 명확하게 작성 (예: "ChatGPT 4o", "Claude 3.5 Sonnet", "RAG 검색 증강 생성 기술").
   * 상투적 템플릿 문구("알아두면 유용한 정보", "완벽 정리", "한눈에 보기", "핵심 정리", "총정리", "주요 내용 및 실용 가이드") 절대 금지.
4. 분량 및 언어: 공백 포함 4,000자 이상의 풍부한 한글 마크다운 본문.
5. 금지사항: 정치적 내용 0% (정치인, 지자체장, 정당 등 절대 제외).`;

                const userPrompt = `주제 키워드: "${keyword}"

비전공자 및 비개발자 독자를 위한 최신 AI 기술/동향 안내 포스트를 작성해 주세요. 아래 [TITLE], [DESCRIPTION], [BODY] 태그 구성을 엄격히 준수하십시오.

[TITLE]
관련 AI 기술명 및 핵심 주제명만 명확하고 깔끔하게 작성 (60자 이내).
(예: "ChatGPT 4o", "Claude 3.5 Sonnet", "RAG 검색 증강 생성 기술")

[DESCRIPTION]
구글 검색 요약(Meta Description)에 들어갈 120~150자 내외의 설명문.

[BODY]
공백 포함 4,000자 이상의 밀도 높은 마크다운 본문.
1. 서론: AI 기술의 최신 동향과 일상/업무에서의 변화 도입.
2. 본론:
   - 비전공자도 쉽게 이해할 수 있는 개념과 직관적 비유(예: "RAG는 원하는 자료를 찾아주는 도서관 사서와 같습니다") 설명.
   - 비개발자가 바로 써볼 수 있는 활용법 및 실용 팁.
   - 마크다운 소제목(H2, H3) 사용.
3. 결론: AI 시대 비전공자를 위한 요약 및 마무리.`;

                const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'meta/llama-3.1-70b-instruct',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.7,
                        max_tokens: 4000
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`NVIDIA API 호출 실패 (${response.status}): ${errText}`);
                }

                const jsonRes = await response.json();
                const rawContent = (jsonRes.choices[0]?.message?.content || '').trim();

                let title = keyword;
                let description = `${keyword}에 대한 비전공자 맞춤 AI 기술 안내.`;
                let body = rawContent;

                const titleMatch = rawContent.match(/\[TITLE\]([\s\S]*?)(?=\[DESCRIPTION\]|\[BODY\]|$)/i);
                const descMatch = rawContent.match(/\[DESCRIPTION\]([\s\S]*?)(?=\[BODY\]|$)/i);
                const bodyMatch = rawContent.match(/\[BODY\]([\s\S]*?)$/i);

                if (titleMatch && titleMatch[1].trim()) title = titleMatch[1].trim().replace(/^["']|["']$/g, '');
                if (descMatch && descMatch[1].trim()) description = descMatch[1].trim();
                if (bodyMatch && bodyMatch[1].trim()) body = bodyMatch[1].trim();

                // Clean markdown and newlines from title/description
                title = title.replace(/\*\*/g, '').replace(/\*/g, '').replace(/[`#_~]/g, '').replace(/[\r\n]+/g, ' ').trim().replace(/\s+/g, ' ');
                description = description.replace(/\*\*/g, '').replace(/\*/g, '').replace(/[`#_~]/g, '').replace(/[\r\n]+/g, ' ').trim().replace(/\s+/g, ' ');

                const today = new Date();
                const kstDate = new Date(today.getTime() + (9 * 60 * 60 * 1000));
                const dateStr = kstDate.toISOString().split('T')[0];

                let slug = keyword.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                if (!slug) slug = 'ai-guide';
                slug = `ai-${slug}`;

                const fullMarkdown = `---
layout: single
title: "${title.replace(/"/g, '\\"')}"
date: ${dateStr} 10:00:00 +0900
description: "${description.replace(/"/g, '\\"')}"
categories: [AI]
tags: [${keyword}]
---

${body}`;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    title,
                    description,
                    body,
                    fullMarkdown,
                    dateStr,
                    slug,
                    filename: `${dateStr}-${slug}.md`
                }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`MonoPoint Admin Local Server running at http://localhost:${PORT}/admin.html`);
});
