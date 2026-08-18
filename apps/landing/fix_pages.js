const fs = require('fs');
const files = [
  'src/app/comunidade/page.tsx',
  'src/app/contato/page.tsx',
  'src/app/cookies/page.tsx',
  'src/app/documentacao/page.tsx',
  'src/app/documentacao/[secao]/page.tsx',
  'src/app/documentacao/[secao]/[guia]/page.tsx',
  'src/app/lgpd/page.tsx',
  'src/app/privacidade/page.tsx',
  'src/app/status/page.tsx',
  'src/app/termos/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.startsWith("'use client'")) {
      fs.writeFileSync(file, "'use client'\n" + content);
      console.log(`Updated ${file}`);
    } else {
      console.log(`Skipped ${file}`);
    }
  } else {
    console.log(`Not found ${file}`);
  }
});
console.log('Done');
