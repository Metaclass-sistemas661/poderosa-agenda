const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'saloes', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Use regex to remove validateCreateForm and handleCreate more robustly
content = content.replace(/const validateCreateForm = async \(\): Promise<boolean> => \{[\s\S]*?return Object.keys\(newErrors\).length === 0\n  \}/, '');

content = content.replace(/\/\/ Criar — Canonical Provisioning Pipeline \(F04\)\n  const handleCreate = async \(\) => \{[\s\S]*?setTimeout\(\(\) => setMessage\(null\), 5000\)\n  \}/, '');

// Also make sure to remove setCreateForm from anywhere else if it remains
content = content.replace(/setCreateForm\(\{[\s\S]*?\}\)/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactoring pass 2 complete!');
