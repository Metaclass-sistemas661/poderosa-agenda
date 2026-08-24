const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'saloes', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove imports not needed maybe? Keep them. Add 'updateSalonDetails'
content = content.replace(
  "import { changeSalonStatus, deleteSalon } from '@/app/actions/salon-management'",
  "import { changeSalonStatus, deleteSalon, updateSalonDetails } from '@/app/actions/salon-management'"
);

// 2. Remove validateCreateForm and handleCreate
const startValidate = content.indexOf('const validateCreateForm = async (): Promise<boolean> => {');
const endHandleCreate = content.indexOf('setIsSaving(false)\n    setTimeout(() => setMessage(null), 5000)\n  }');
if (startValidate !== -1 && endHandleCreate !== -1) {
  content = content.substring(0, startValidate) + content.substring(endHandleCreate + 'setIsSaving(false)\n    setTimeout(() => setMessage(null), 5000)\n  }'.length);
}

// 3. Remove createForm state, showCreateDrawer state
content = content.replace(/const \[showCreateDrawer, setShowCreateDrawer\] = useState\(false\)\n/g, '');
content = content.replace(/const \[createForm, setCreateForm\] = useState\(\{[\s\S]*?\}\)/, '');
content = content.replace(/const \[errors, setErrors\] = useState<Record<string, string>>\(\{\}\)\n/g, '');

// 4. Remove 'Novo Salão' button from header
content = content.replace(
  /<button\s+onClick=\{\(\) => setShowCreateDrawer\(true\)\}[\s\S]*?<\/button>/,
  ''
);

// 5. Remove 'Criar Primeiro Salão' button
content = content.replace(
  /\{!searchTerm && filterStatus === 'all' && \([\s\S]*?<\/button>\s*\)\}/,
  ''
);

// 6. Remove the entire Create Drawer
const createDrawerStart = content.indexOf('{/* Create Drawer */}');
const createDrawerEnd = content.indexOf('{/* Edit Drawer */}');
if (createDrawerStart !== -1 && createDrawerEnd !== -1) {
  content = content.substring(0, createDrawerStart) + content.substring(createDrawerEnd);
}

// 7. Change handleEdit to set editing modes and handleSaveEdit logic
// We will replace the entire Edit Drawer with the Read-to-Edit one.
// Let's find Edit Drawer start and end
const editDrawerStart = content.indexOf('{/* Edit Drawer */}');
const deleteModalStart = content.indexOf('{/* Delete Modal */}');

if (editDrawerStart !== -1 && deleteModalStart !== -1) {
    const inlineEditDrawer = `
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
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
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

                {/* LOCALIZAÇÃO */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Localização</h3>
                  
                  <div className="bg-[#1a2332] rounded-xl border border-white/10 divide-y divide-white/5">
                    
                    {/* Cidade */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Cidade</p>
                        <input
                          type="text"
                          value={editForm.city || ''}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500 transition-colors py-1"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-600" />
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
      </AnimatePresence>\n\n      `;
      content = content.substring(0, editDrawerStart) + inlineEditDrawer + content.substring(deleteModalStart);
}

// 8. Replace handleSaveEdit logic to call the Server Action
const saveEditRegex = /const handleSaveEdit = async \(\) => \{[\s\S]*?setTimeout\(\(\) => setMessage\(null\), 3000\)\n  \}/;
const newHandleSaveEdit = `const handleSaveEdit = async () => {
    if (!selectedSalon) return
    setIsSaving(true)
    
    // Server action call with full RPC audit
    const result = await updateSalonDetails(selectedSalon.id, editForm as any)

    if (result.success) {
      setSalons(prev => prev.map(s => s.id === selectedSalon.id ? { ...s, ...editForm } as Salon : s))
      setMessage({ type: 'success', text: 'Salão atualizado com sucesso!' })
      setShowEditDrawer(false)
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao atualizar.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }`;
content = content.replace(saveEditRegex, newHandleSaveEdit);

// 9. Change handleEdit to ensure it sets cnpj, owner_cpf, address from selectedSalon
const handleEditRegex = /const handleEdit = \(salon: Salon\) => \{[\s\S]*?setShowEditDrawer\(true\)\n  \}/;
const newHandleEdit = `const handleEdit = (salon: Salon) => {
    setSelectedSalon(salon)
    setEditForm({
      name: salon.name,
      owner_name: salon.owner_name,
      phone: salon.phone,
      city: salon.city,
      state: salon.state,
      plan: salon.plan,
      status: salon.status,
      professionals_count: salon.professionals_count,
      cnpj: salon.cnpj,
      owner_cpf: salon.owner_cpf,
      address: salon.address
    })
    setShowEditDrawer(true)
  }`;
content = content.replace(handleEditRegex, newHandleEdit);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactoring complete!');
