const fs = require('fs');
const html = fs.readFileSync('adsense_dump.html', 'utf8');
const regex = /<div class="subtitle">([^<]+)<\/div>.*?<div class="kwds">/gs;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(match[1]);
}
