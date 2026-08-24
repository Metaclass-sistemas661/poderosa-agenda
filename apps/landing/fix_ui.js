const fs = require('fs');
const path = require('path');

const refactorUiPath = path.join(__dirname, 'refactor_ui.js');
let refactorUiCode = fs.readFileSync(refactorUiPath, 'utf8');

// The bug in refactor_ui.js was the regexes for the drawers.
// We will replace the regex logic with index-based substring replacement.
const badRegexLogic = `content = content.replace(editDrawerRegex, editDrawerCode);

// 6. Rewrite View Drawer to be more Enterprise and display the new fields
const viewDrawerRegex = /\\{\\/\\* View Drawer \\*\\/\\}([\\s\\S]*?)\\{\\/\\* Delete Modal \\*\\/\\}/;`;

// wait, let's just do it directly on page.tsx!

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'saloes', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update interface Salon
if (!content.includes('zip_code: string | null')) {
    content = content.replace(
      /address: string \| null[\s\S]*?created_at: string/,
      "address: string | null\n  zip_code: string | null\n  address_number: string | null\n  neighborhood: string | null\n  created_at: string"
    );
}

// 2. Insert fetchAddressByCep
if (!content.includes('fetchAddressByCep')) {
    const afterFormState = content.indexOf('const [editForm, setEditForm] = useState<Partial<Salon>>({})');
    const fetchCepCode = `
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      const res = await fetch(\`https://viacep.com.br/ws/\${cleanCep}/json/\`);
      const data = await res.json();
      if (!data.erro) {
        setEditForm(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (e) {
      console.error('Erro ao buscar CEP', e);
    }
  };
`;
    content = content.substring(0, afterFormState + 62) + fetchCepCode + content.substring(afterFormState + 62);
}

// 3. Fix handleEdit to set the new fields
if (!content.includes('zip_code: salon.zip_code')) {
    content = content.replace(
      /professionals_count: salon\.professionals_count[\s\S]*?\}\)/,
      `professionals_count: salon.professionals_count,
      cnpj: salon.cnpj,
      owner_cpf: salon.owner_cpf,
      address: salon.address,
      zip_code: salon.zip_code,
      address_number: salon.address_number,
      neighborhood: salon.neighborhood
    })`
    );
}

// 4. Update handleSaveEdit to update selectedSalon
if (!content.includes('setSelectedSalon(updatedSalon)')) {
    const saveEditRegex = /const handleSaveEdit = async \(\) => \{[\s\S]*?setTimeout\(\(\) => setMessage\(null\), 3000\)\n  \}/;
    const newHandleSaveEdit = `const handleSaveEdit = async () => {
    if (!selectedSalon) return
    setIsSaving(true)
    
    // Server action call with full RPC audit
    const result = await updateSalonDetails(selectedSalon.id, editForm as any)

    if (result.success) {
      const updatedSalon = { ...selectedSalon, ...editForm } as Salon;
      setSalons(prev => prev.map(s => s.id === selectedSalon.id ? updatedSalon : s))
      setSelectedSalon(updatedSalon) // <--- Garante reatividade na visualização
      setMessage({ type: 'success', text: 'Salão atualizado com sucesso!' })
      setShowEditDrawer(false)
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao atualizar.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }`;
    content = content.replace(saveEditRegex, newHandleSaveEdit);
}

// 5 & 6. Replace Drawers
// We extract the drawer codes from refactor_ui.js
const viewDrawerCodeStart = refactorUiCode.indexOf('const viewDrawerCode = `') + 24;
const viewDrawerCodeEnd = refactorUiCode.lastIndexOf('`;');
const viewDrawerCode = refactorUiCode.substring(viewDrawerCodeStart, viewDrawerCodeEnd);

const editDrawerCodeStart = refactorUiCode.indexOf('const editDrawerCode = `') + 24;
const editDrawerCodeEnd = refactorUiCode.indexOf('`;\ncontent = content.replace(editDrawerRegex');
const editDrawerCode = refactorUiCode.substring(editDrawerCodeStart, editDrawerCodeEnd);

const viewIndex = content.indexOf('{/* View Drawer */}');
const deleteIndex = content.indexOf('{/* Delete Modal */}');

if (viewIndex !== -1 && deleteIndex !== -1) {
    content = content.substring(0, viewIndex) + viewDrawerCode + '\n\n' + editDrawerCode + '\n\n      ' + content.substring(deleteIndex);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed UI refactoring successfully!');
