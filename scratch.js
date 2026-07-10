const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('https://adsensefarm.kr/realtime/', { waitUntil: 'networkidle2' });
    
    const html = await page.evaluate(() => {
        const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
        const target = headers.find(h => h.innerText.includes('구글'));
        if (!target) return 'No header found';
        
        let result = target.outerHTML + '\n';
        let next = target.nextElementSibling;
        for(let i=0; i<3 && next; i++) {
            result += next.outerHTML + '\n';
            next = next.nextElementSibling;
        }
        return result;
    });
    
    console.log(html);
    await browser.close();
})();
