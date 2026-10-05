const fs = require('fs');
const path = require('path');

const lintOutput = `
./src/app/salon/agendamentos/page.tsx
424:17  Warning: Using \`<img>\`
454:23  Warning: Using \`<img>\`
478:15  Warning: Using \`<img>\`

./src/app/salon/configuracoes/page.tsx
1169:25  Warning: Using \`<img>\`
1171:25  Warning: Image elements must have an alt prop

./src/app/salon/layout.tsx
576:15  Warning: Using \`<img>\`

./src/app/salon/profissionais/page.tsx
445:19  Warning: Using \`<img>\`
500:46  Warning: Using \`<img>\`
502:44  Warning: Using \`<img>\`

./src/app/salon/servicos/page.tsx
534:23  Warning: Using \`<img>\`

./src/components/salon/ProfessionalCard.tsx
70:13  Warning: Using \`<img>\`

./src/sections/Integrations.tsx
36:7  Warning: Using \`<img>\`

./src/sections/Problem.tsx
39:17  Warning: Using \`<img>\`
56:15  Warning: Using \`<img>\`
65:15  Warning: Using \`<img>\`

./src/sections/WhyChoose.tsx
70:13  Warning: Using \`<img>\`
82:13  Warning: Using \`<img>\`
`;

const lines = lintOutput.split('\n');
const filesToProcess = new Set();
lines.forEach(line => {
  if (line.startsWith('./src/')) {
    filesToProcess.add(line.trim());
  }
});

filesToProcess.forEach(file => {
  const filePath = path.join('c:/Users/andre/Desktop/Projeto Hurick/apps/landing', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace <img ... /> with <Image unoptimized ... />
  // Careful with <img src="..." alt="..." className="..." />
  // First, check if import Image exists
  if (!content.includes('import Image from \'next/image\'') && !content.includes('import Image from "next/image"')) {
    content = "import Image from 'next/image'\n" + content;
  }

  // Regex to match <img ... />
  content = content.replace(/<img([^>]*)>/g, (match, attrs) => {
    // If it lacks alt, add an empty one
    if (!attrs.includes('alt=')) {
      attrs += ' alt=""';
    }
    // ensure closing slash
    if (!attrs.endsWith('/')) {
      attrs += ' /';
    }
    
    // Add width and height dynamically or unoptimized if missing sizes. Let's use unoptimized and layout fill if width/height are missing, but simpler is just adding width={100} height={100} unoptimized.
    // Actually, Image requires width/height or layout="fill". To avoid layout breaking, we can add unoptimized width={100} height={100} or just use unoptimized width={0} height={0} sizes="100vw" style={{ width: '100%', height: 'auto' }}.
    // But since these are mostly icons or specific sizes controlled by classes, it's safer to use width={500} height={500} and let CSS handle it.
    
    // Ensure we don't duplicate unoptimized
    let newAttrs = attrs;
    if (!newAttrs.includes('unoptimized')) {
      newAttrs += ' unoptimized width={500} height={500}';
    }
    
    return `<Image${newAttrs}>`;
  });

  fs.writeFileSync(filePath, content);
  console.log('Fixed images in', file);
});
