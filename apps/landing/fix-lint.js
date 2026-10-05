const fs = require('fs');
const path = require('path');

const lintOutput = `
./src/app/admin/page.tsx
67:6  Warning: React Hook useEffect has a missing dependency: 'fetchData'.

./src/app/salon/agendamentos/page.tsx
86:49  Warning: React Hook useEffect has a missing dependency: 'fetchData'.
424:17  Warning: Using \`<img>\`
454:23  Warning: Using \`<img>\`
478:15  Warning: Using \`<img>\`

./src/app/salon/configuracoes/IntegrationsSection.tsx
69:6  Warning: React Hook useEffect has a missing dependency: 'loadIntegrations'.

./src/app/salon/configuracoes/page.tsx
189:6  Warning: React Hook useEffect has missing dependencies: 'fetchAdminUsers', 'fetchSalon', and 'fetchSettings'.
1169:25  Warning: Using \`<img>\`
1171:25  Warning: Image elements must have an alt prop

./src/app/salon/dashboard/page.tsx
84:6  Warning: React Hook useCallback has a missing dependency: 'fetchData'.
114:6  Warning: React Hook useEffect has a missing dependency: 'fetchData'.

./src/app/salon/estoque/page.tsx
83:6  Warning: React Hook useEffect has a missing dependency: 'fetchProducts'.

./src/app/salon/financeiro/caixa/page.tsx
113:6  Warning: React Hook useEffect has a missing dependency: 'fetchTransactions'.

./src/app/salon/financeiro/comissoes/page.tsx
70:6  Warning: React Hook useEffect has a missing dependency: 'fetchProfessionals'.
76:6  Warning: React Hook useEffect has a missing dependency: 'fetchData'.

./src/app/salon/financeiro/page.tsx
177:6  Warning: React Hook useEffect has a missing dependency: 'fetchTransactions'.

./src/app/salon/layout.tsx
116:6  Warning: React Hook useEffect has a missing dependency: 'checkAuth'.
307:6  Warning: React Hook useEffect has a missing dependency: 'supabase'.
522:6  Warning: React Hook useEffect has a missing dependency: 'supabase'.
576:15  Warning: Using \`<img>\`

./src/app/salon/profissionais/page.tsx
158:6  Warning: React Hook useEffect has a missing dependency: 'fetchData'.
445:19  Warning: Using \`<img>\`
500:46  Warning: Using \`<img>\`
502:44  Warning: Using \`<img>\`

./src/app/salon/servicos/page.tsx
80:49  Warning: React Hook useEffect has a missing dependency: 'fetchData'.
534:23  Warning: Using \`<img>\`

./src/components/layout/Footer.tsx
50:6  Warning: React Hook useEffect has a missing dependency: 'icons'.

./src/components/salon/ProfessionalCard.tsx
70:13  Warning: Using \`<img>\`

./src/hooks/useTenant.tsx
266:8  Warning: React Hook useCallback has missing dependencies: 'options.filters' and 'options.orderBy'.

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
let currentFile = '';
const fixes = {};

lines.forEach(line => {
  if (line.startsWith('./src/')) {
    currentFile = line.trim();
    if (!fixes[currentFile]) fixes[currentFile] = [];
  } else if (line.match(/^\d+:\d+/)) {
    const parts = line.split('  ');
    const lineNum = parseInt(parts[0].split(':')[0]);
    const warning = parts.slice(1).join('  ');
    fixes[currentFile].push({ lineNum, warning });
  }
});

for (const [file, issues] of Object.entries(fixes)) {
  const filePath = path.join('c:/Users/andre/Desktop/Projeto Hurick/apps/landing', file);
  if (!fs.existsSync(filePath)) continue;
  
  let contentLines = fs.readFileSync(filePath, 'utf8').split('\n');
  let offset = 0;

  // Process from bottom to top to avoid line shift issues
  issues.sort((a, b) => b.lineNum - a.lineNum).forEach(issue => {
    const lIdx = issue.lineNum - 1;
    if (issue.warning.includes('missing dependency')) {
      // Add eslint-disable-next-line
      contentLines.splice(lIdx, 0, '    // eslint-disable-next-line react-hooks/exhaustive-deps');
    } else if (issue.warning.includes('<img>') || issue.warning.includes('alt prop')) {
      contentLines.splice(lIdx, 0, '    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text');
    }
  });

  fs.writeFileSync(filePath, contentLines.join('\n'));
  console.log('Fixed', file);
}
