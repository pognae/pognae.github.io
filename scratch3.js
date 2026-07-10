const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Log all requests
    page.on('response', async (response) => {
        if (response.request().resourceType() === 'xhr' || response.request().resourceType() === 'fetch') {
            console.log('XHR/Fetch:', response.url());
            try {
                const text = await response.text();
                console.log('Data:', text.substring(0, 200));
            } catch(e){}
        }
    });

    await page.goto('https://adsensefarm.kr/realtime/', { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Check DOM manually
    const html = await page.evaluate(() => {
        const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('구글'));
        if (h2) {
             const subtitle = h2.closest('.subtitle');
             if (subtitle && subtitle.nextElementSibling && subtitle.nextElementSibling.nextElementSibling) {
                 return subtitle.nextElementSibling.nextElementSibling.innerHTML;
             }
        }
        return 'Not found in DOM';
    });
    console.log('DOM Content:', html);
    await browser.close();
})();
