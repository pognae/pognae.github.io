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

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`MonoPoint Admin Local Server running at http://localhost:${PORT}/admin.html`);
});
