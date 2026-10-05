const fs = require('fs');
const path = require('path');

const lintOutput = `
./src/app/salon/agendamentos/page.tsx
./src/app/salon/clientes/page.tsx
./src/app/salon/configuracoes/page.tsx
./src/app/salon/layout.tsx
./src/app/salon/profissionais/page.tsx
./src/app/salon/servicos/page.tsx
./src/components/salon/ProfessionalCard.tsx
./src/hooks/useTenant.tsx
./src/sections/Integrations.tsx
./src/sections/Problem.tsx
./src/sections/WhyChoose.tsx
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

  // Fix the bad Image tags
  content = content.replace(/\/\s*unoptimized width=\{500\} height=\{500\}>/g, 'unoptimized width={500} height={500} />');
  content = content.replace(/\/\s*alt="" unoptimized width=\{500\} height=\{500\}>/g, 'alt="" unoptimized width={500} height={500} />');

  // Also there's one where it might be `alt="..." / unoptimized`
  // A generic fix: `<Image ... / unoptimized ... >`
  content = content.replace(/<Image(.*?)\/(.*?)>/g, (match, p1, p2) => {
    // If there is a slash before unoptimized, remove it and put it at the end
    if (p2.includes('unoptimized')) {
      return `<Image${p1}${p2} />`;
    }
    return match;
  });

  fs.writeFileSync(filePath, content);
  console.log('Fixed syntax in', file);
});
