const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'saloes', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update interface Salon
content = content.replace(
  /address: string \| null\n  created_at: string/,
  "address: string | null\n  zip_code: string | null\n  address_number: string | null\n  neighborhood: string | null\n  created_at: string"
);

// 2. Insert fetchAddressByCep
const afterFormState = content.indexOf('const [editForm, setEditForm] = useState<Partial<Salon>>({})');
if (afterFormState !== -1) {
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
content = content.replace(
  /professionals_count: salon\.professionals_count,[\s\S]*?address: salon\.address\n    \}\)/,
  `professionals_count: salon.professionals_count,
      cnpj: salon.cnpj,
      owner_cpf: salon.owner_cpf,
      address: salon.address,
      zip_code: salon.zip_code,
      address_number: salon.address_number,
      neighborhood: salon.neighborhood
    })`
);

// 4. Update handleSaveEdit to update selectedSalon (so View Drawer reacts)
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

// 5. Rewrite the Edit Drawer to include ZIP, Address, Neighborhood, Number
const editDrawerRegex = /\{\/\* Edit Drawer \(Read-to-Edit Pattern\) \*\/\}([\s\S]*?)\{\/\* View Drawer \*\/\}/;
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
                    <div className="p-4 flex items-center justify-between gap-4 group">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Nome do Salão</p>
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <div className="p-4 flex items-center justify-between gap-4 group">
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
                      <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* CONTATO & PROPRIETÁRIO */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Contato & Responsável</h3>
                  <div className="bg-[#1a2332] rounded-xl border border-white/10 divide-y divide-white/5">
                    <div className="p-4 flex items-center justify-between gap-4 group">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Proprietário</p>
                        <input
                          type="text"
                          value={editForm.owner_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <div className="p-4 flex items-center justify-between gap-4 group">
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
                      <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <div className="p-4 flex items-center justify-between gap-4 group">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                        <input
                          type="text"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({ ...editForm, phone: formatPhone(e.target.value) })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* LOCALIZAÇÃO (COM VIACEP) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Localização</h3>
                  <div className="bg-[#1a2332] rounded-xl border border-white/10 divide-y divide-white/5">
                    
                    {/* CEP */}
                    <div className="p-4 flex items-center justify-between gap-4 group">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">CEP</p>
                        <input
                          type="text"
                          value={editForm.zip_code || ''}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\\D/g, '').slice(0,8);
                            val = val.replace(/(\\d{5})(\\d)/, '$1-$2');
                            setEditForm({ ...editForm, zip_code: val });
                            if (val.replace(/\\D/g, '').length === 8) fetchAddressByCep(val);
                          }}
                          placeholder="00000-000"
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1 placeholder-gray-700"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                    </div>

                    {/* Rua */}
                    <div className="p-4 flex items-center justify-between gap-4 group">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Endereço (Rua/Av)</p>
                        <input
                          type="text"
                          value={editForm.address || ''}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          placeholder="Ex: Av. Paulista"
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1 placeholder-gray-700"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                    </div>

                    {/* Número e Bairro */}
                    <div className="flex divide-x divide-white/5">
                        <div className="p-4 flex-1 group">
                          <p className="text-xs text-gray-500 mb-1">Número</p>
                          <div className="flex gap-2">
                             <input
                               type="text"
                               value={editForm.address_number || ''}
                               onChange={(e) => setEditForm({ ...editForm, address_number: e.target.value })}
                               placeholder="S/N"
                               className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1 placeholder-gray-700"
                             />
                             <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-1" />
                          </div>
                        </div>
                        <div className="p-4 flex-[2] group">
                          <p className="text-xs text-gray-500 mb-1">Bairro</p>
                          <div className="flex gap-2">
                             <input
                               type="text"
                               value={editForm.neighborhood || ''}
                               onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                               placeholder="Bairro"
                               className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1 placeholder-gray-700"
                             />
                             <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-1" />
                          </div>
                        </div>
                    </div>

                    {/* Cidade */}
                    <div className="p-4 flex items-center justify-between gap-4 group">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Cidade</p>
                        <input
                          type="text"
                          value={editForm.city || ''}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                    </div>

                    {/* Estado */}
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-2">Estado</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {stateOptionsWithNames.map((st) => (
                          <button
                            key={st.uf}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, state: st.uf })}
                            className={\`w-full px-3 py-2 text-sm rounded-lg text-left transition-colors \${editForm.state === st.uf
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-gray-400 hover:bg-white/5'
                              }\`}
                          >
                            {st.uf} - {st.name}
                          </button>
                        ))}
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
      {/* View Drawer */}`;
content = content.replace(editDrawerRegex, editDrawerCode);

// 6. Rewrite View Drawer to be more Enterprise and display the new fields
const viewDrawerRegex = /\{\/\* View Drawer \*\/\}([\s\S]*?)\{\/\* Delete Modal \*\/\}/;
const viewDrawerCode = `
      {/* View Drawer */}
      <AnimatePresence>
        {showViewDrawer && selectedSalon && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowViewDrawer(false)}
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
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">{selectedSalon.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={\`w-2 h-2 rounded-full \${statusConfig[selectedSalon.status].dot}\`} />
                      <span className={\`text-xs font-medium \${statusConfig[selectedSalon.status].color.replace('bg-','').split(' ')[1]}\`}>
                        {statusConfig[selectedSalon.status].label}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewDrawer(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                
                {/* Section: Identificação */}
                <div className="bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Identificação</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Proprietário</p>
                      <p className="text-sm text-gray-200 font-medium">{selectedSalon.owner_name}</p>
                    </div>
                    {selectedSalon.owner_cpf && (
                      <div>
                        <p className="text-xs text-gray-500">CPF do Responsável</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.owner_cpf}</p>
                      </div>
                    )}
                    {selectedSalon.cnpj && (
                      <div>
                        <p className="text-xs text-gray-500">CNPJ da Empresa</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.cnpj}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Contato */}
                <div className="bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Contato</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Email (Acesso)</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">WhatsApp</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Endereço (Detalhamento Completo) */}
                <div className="bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Localização</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Endereço</p>
                        <p className="text-sm text-gray-200 font-medium">
                          {selectedSalon.address ? \`\${selectedSalon.address}\${selectedSalon.address_number ? ', ' + selectedSalon.address_number : ''}\` : 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Bairro</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.neighborhood || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">CEP</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.zip_code || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cidade</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.city}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Estado</p>
                        <p className="text-sm text-gray-200 font-medium">{selectedSalon.state}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Assinatura e Dados */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm">
                    <Star className="w-4 h-4 text-emerald-400 mb-2" />
                    <p className="text-xs text-gray-500">Plano</p>
                    <p className="text-sm text-gray-200 font-medium">{planConfig[selectedSalon.plan].label}</p>
                  </div>
                  <div className="bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm">
                    <Users className="w-4 h-4 text-emerald-400 mb-2" />
                    <p className="text-xs text-gray-500">Tamanho</p>
                    <p className="text-sm text-gray-200 font-medium">{selectedSalon.professionals_count} prof.</p>
                  </div>
                  <div className="col-span-2 bg-[#1a2332] p-5 rounded-2xl border border-white/5 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Data de Cadastro</p>
                      <p className="text-sm text-gray-200 font-medium">{formatDate(selectedSalon.created_at)}</p>
                    </div>
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 bg-[#0f1419]">
                <button
                  onClick={() => {
                    setShowViewDrawer(false)
                    handleEdit(selectedSalon)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500/10 text-emerald-400 font-medium rounded-xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                >
                  <Edit3 className="w-5 h-5" />
                  Editar Salão
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Delete Modal */}`;
content = content.replace(viewDrawerRegex, viewDrawerCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('UI refactoring for enterprise view complete!');
