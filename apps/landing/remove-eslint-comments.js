const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/app/admin/layout.tsx',
    'src/app/admin/saloes/page.tsx',
    'src/app/admin/solicitacoes/page.tsx',
    'src/app/admin/usuarios/novo/page.tsx',
    'src/app/admin/usuarios/page.tsx',
    'src/app/cadastro/page.tsx'
];

filesToFix.forEach(file => {
    const filePath = path.join(__dirname, file);
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalLength = content.length;

        // Remove the eslint-disable comment lines
        content = content.replace(/\s*\/\/\s*eslint-disable-next-line\s+@typescript-eslint\/no-explicit-any\s*\n/g, '\n');

        if (content.length !== originalLength) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Fixed: ${file}`);
        } else {
            console.log(`- Skipped (no changes): ${file}`);
        }
    } catch (err) {
        console.error(`✗ Error processing ${file}:`, err.message);
    }
});

console.log('\nDone!');