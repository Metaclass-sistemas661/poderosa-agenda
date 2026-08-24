const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src', 'app', 'admin', 'saloes', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// The Edit Drawer we want to inject
const editDrawerCode = `
      {/* Edit Drawer (Read-to-Edit Pattern) */}
      <AnimatePresence>
        {showEditDrawer && selectedSalon && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowEditDrawer(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0f1419] z-50 shadow-2xl flex flex-col"
              data-lenis-prevent
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Editar Salão</h2>
                    <p className="text-xs text-gray-500">{selectedSalon.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditDrawer(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* DADOS DA EMPRESA */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Dados da Empresa</h3>
                  
                  <div className="bg-[#1a2332] rounded-xl border border-white/10 divide-y divide-white/5">
                    {/* Nome */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Nome do Salão</p>
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600" />
                    </div>

                    {/* CNPJ */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">CNPJ</p>
                        <input
                          type="text"
                          value={editForm.cnpj || ''}
                          onChange={(e) => setEditForm({ ...editForm, cnpj: formatCNPJ(e.target.value) })}
                          placeholder="Não informado"
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1 placeholder-gray-700"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* CONTATO & PROPRIETÁRIO */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Contato & Responsável</h3>
                  
                  <div className="bg-[#1a2332] rounded-xl border border-white/10 divide-y divide-white/5">
                    {/* Proprietário */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Proprietário</p>
                        <input
                          type="text"
                          value={editForm.owner_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600" />
                    </div>

                    {/* CPF */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">CPF do Responsável</p>
                        <input
                          type="text"
                          value={editForm.owner_cpf || ''}
                          onChange={(e) => setEditForm({ ...editForm, owner_cpf: formatCPF(e.target.value) })}
                          placeholder="Não informado"
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1 placeholder-gray-700"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600" />
                    </div>

                    {/* Telefone */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                        <input
                          type="text"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({ ...editForm, phone: formatPhone(e.target.value) })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* ENDEREÇO (ViaCEP) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Localização</h3>
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  
                  <div className="bg-[#1a2332] rounded-xl border border-white/10 divide-y divide-white/5">
                    {/* CEP */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">CEP (Busca Automática)</p>
                        <input
                          type="text"
                          value={editForm.zip_code || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\\D/g, '').slice(0, 8);
                            const formatted = val.replace(/(\\d{5})(\\d)/, '$1-$2');
                            setEditForm({ ...editForm, zip_code: formatted });
                            if (val.length === 8) fetchAddressByCep(val);
                          }}
                          placeholder="00000-000"
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1 placeholder-gray-700"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600" />
                    </div>

                    {/* Endereço e Número */}
                    <div className="p-4 grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Endereço</p>
                        <input
                          type="text"
                          value={editForm.address || ''}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          placeholder="Rua, Avenida..."
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1 placeholder-gray-700"
                        />
                      </div>
                      <div className="">
                        <p className="text-xs text-gray-500 mb-1">Número</p>
                        <input
                          type="text"
                          value={editForm.address_number || ''}
                          onChange={(e) => setEditForm({ ...editForm, address_number: e.target.value })}
                          placeholder="Nº"
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1 placeholder-gray-700"
                        />
                      </div>
                    </div>

                    {/* Bairro */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Bairro</p>
                        <input
                          type="text"
                          value={editForm.neighborhood || ''}
                          onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                          placeholder="Bairro"
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1 placeholder-gray-700"
                        />
                      </div>
                    </div>

                    {/* Cidade e Estado */}
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cidade</p>
                        <input
                          type="text"
                          value={editForm.city || ''}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estado</p>
                        <input
                          type="text"
                          value={editForm.state || ''}
                          onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SISTEMA & ASSINATURA */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Sistema</h3>
                  
                  {/* Plano */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Plano Ativo</p>
                    {Object.entries(planConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, plan: key as Salon['plan'] })}
                        className={\`w-full flex items-center gap-3 p-3 rounded-xl border transition-all \${editForm.plan === key
                          ? 'bg-emerald-500/10 border-emerald-500/50'
                          : 'bg-[#1a2332] border-white/10 hover:border-white/20'
                          }\`}
                      >
                        <div className={\`w-8 h-8 bg-gradient-to-br \${config.gradient} rounded-lg flex items-center justify-center\`}>
                          <Star className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium text-sm">{config.label}</p>
                        </div>
                        {editForm.plan === key && (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-gray-500">Status da Conta</p>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, status: key as Salon['status'] })}
                        className={\`w-full flex items-center gap-3 p-3 rounded-xl border transition-all \${editForm.status === key
                          ? 'bg-emerald-500/10 border-emerald-500/50'
                          : 'bg-[#1a2332] border-white/10 hover:border-white/20'
                          }\`}
                      >
                        <span className={\`w-2.5 h-2.5 rounded-full \${config.dot}\`} />
                        <p className="text-white font-medium flex-1 text-left text-sm">{config.label}</p>
                        {editForm.status === key && (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 space-y-3 bg-[#0f1419]">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Salvar Alterações
                </button>
                <button
                  onClick={() => setShowEditDrawer(false)}
                  className="w-full px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
`;

// Insert the Drawer
if (!content.includes('{/* Edit Drawer (Read-to-Edit Pattern) */}')) {
  const deleteModalIndex = content.indexOf('{/* Delete Modal */}');
  content = content.substring(0, deleteModalIndex) + editDrawerCode + '\\n      ' + content.substring(deleteModalIndex);
}

// 2. Insert fetchAddressByCep if not exists
if (!content.includes('fetchAddressByCep')) {
  const formStateIndex = content.indexOf('const [editForm, setEditForm] = useState<Partial<Salon>>({})');
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
  content = content.substring(0, formStateIndex + 62) + fetchCepCode + content.substring(formStateIndex + 62);
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

// 4. Update handleSaveEdit to update selectedSalon correctly
if (!content.includes('setSelectedSalon(updatedSalon)')) {
  const saveEditRegex = /const handleSaveEdit = async \(\) => \{[\s\S]*?setTimeout\(\(\) => setMessage\(null\), 3000\)\n  \}/;
  const newHandleSaveEdit = `const handleSaveEdit = async () => {
    if (!selectedSalon) return
    setIsSaving(true)
    
    const result = await updateSalonDetails(selectedSalon.id, editForm as any)

    if (result.success) {
      const updatedSalon = { ...selectedSalon, ...editForm } as Salon;
      setSalons(prev => prev.map(s => s.id === selectedSalon.id ? updatedSalon : s))
      setSelectedSalon(updatedSalon) // <--- Garante reatividade
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

fs.writeFileSync(pagePath, content, 'utf8');
console.log('Final fix applied successfully!');
