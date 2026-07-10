const https = require('https');
const fs = require('fs');

https.get('https://adsensefarm.kr/realtime/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('adsense_dump.html', data);
        console.log('Saved to adsense_dump.html');
    });
}).on('error', err => console.log(err));
