const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', '_posts');

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.md')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace lines starting with '#' (like '## 제목') with just the text ('제목')
    const cleanedContent = content.replace(/^#+\s+/gm, '');
    
    if (cleanedContent !== content) {
      console.log(`Removed header markdown from body in ${file}`);
      fs.writeFileSync(filePath, cleanedContent, 'utf-8');
    }
  }
});
console.log("Done cleaning markdown from body.");
