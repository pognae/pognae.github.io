const https = require('https');

https.get('https://adsensefarm.kr/realtime/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Find "구글 실시간 검색어" and the HTML around it
        const idx = data.indexOf('구글 실시간 검색어');
        if (idx !== -1) {
            console.log(data.substring(idx - 100, idx + 500));
        } else {
            console.log('Not found');
        }
    });
}).on('error', err => console.log(err));
