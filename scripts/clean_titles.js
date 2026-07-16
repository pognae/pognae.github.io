const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', '_posts');

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.md')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Match the title line in the frontmatter, including multiline titles
    const titleRegex = /^title:\s*"([^]*?)"/m;
    const match = content.match(titleRegex);
    
    if (match) {
      let originalTitle = match[1];
      // Remove common markdown characters: # * _ [ ] ` and any newlines
      let cleanedTitle = originalTitle.replace(/[#\*_\[\]\`\n\r]/g, '').trim();
      
      if (cleanedTitle !== originalTitle) {
        console.log(`Cleaning title in ${file}`);
        content = content.replace(titleRegex, `title: "${cleanedTitle}"`);
        fs.writeFileSync(filePath, content, 'utf-8');
      }
    }
  }
});
console.log("Done cleaning titles.");
