'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  Edit3,
  X,
  CheckCircle,
  AlertCircle,
  Save,
  TrendingDown,
  DollarSign,
  Box,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSalonLayout } from '@/contexts/SalonLayoutContext'

interface Product {
  id: string
  salon_id: string
  name: string
  description: string | null
  category: string | null
  sale_price: number
  cost_price: number | null
  stock_quantity: number
  min_stock: number
  barcode: string | null
  status: string
  created_at: string
  updated_at: string
}

const categories = ['Shampoo', 'Condicionador', 'Máscara', 'Tratamento', 'Coloração', 'Ferramentas', 'Outros']
const units = ['un', 'ml', 'g', 'L', 'kg']

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showLowStock, setShowLowStock] = useState(false)
  const { salonId } = useSalonLayout()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    stock_quantity: '',
    min_stock_level: '',
    unit: 'un',
    barcode: ''
  })

  const [editForm, setEditForm] = useState({ ...createForm })

  useEffect(() => {
    if (salonId) fetchProducts()
  }, [salonId])

  const fetchProducts = async () => {
    if (!salonId) return
    setIsLoading(true)

    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('salon_id', salonId)
      .order('name', { ascending: true })

    if (data) setProducts(data)
    if (error) console.error('Erro:', error)
    setIsLoading(false)
  }

  const handleCreate = async () => {
    if (!salonId || !createForm.name || !createForm.price || !createForm.stock_quantity) {
      setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setIsSaving(true)

    try {
      const { data, error } = await (supabase as any)
        .from('products')
        .insert({
          salon_id: salonId,
          name: createForm.name,
          description: createForm.description || null,
          category: createForm.category || null,
          sale_price: parseFloat(createForm.price),
          cost_price: createForm.cost ? parseFloat(createForm.cost) : null,
          stock_quantity: parseInt(createForm.stock_quantity),
          min_stock: createForm.min_stock_level ? parseInt(createForm.min_stock_level) : 10,
          barcode: createForm.barcode || null
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setProducts(prev => [...prev, data])
        setMessage({ type: 'success', text: 'Produto criado!' })
        setShowCreateDrawer(false)
        resetCreateForm()
      }
    } catch (err: any) {
      console.error('Erro:', err)
      setMessage({ type: 'error', text: err.message || 'Erro ao criar produto' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setEditForm({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      price: product.sale_price ? product.sale_price.toString() : '0',
      cost: product.cost_price?.toString() || '',
      stock_quantity: product.stock_quantity ? product.stock_quantity.toString() : '0',
      min_stock_level: product.min_stock ? product.min_stock.toString() : '10',
      unit: 'un',
      barcode: product.barcode || ''
    })
    setShowEditDrawer(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedProduct) return
    setIsSaving(true)

    const { error } = await (supabase as any)
      .from('products')
      .update({
        name: editForm.name,
        description: editForm.description || null,
        category: editForm.category || null,
        sale_price: parseFloat(editForm.price),
        cost_price: editForm.cost ? parseFloat(editForm.cost) : null,
        stock_quantity: parseInt(editForm.stock_quantity),
        min_stock: parseInt(editForm.min_stock_level),
        barcode: editForm.barcode || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedProduct.id)

    if (!error) {
      setProducts(prev => prev.map(p =>
        p.id === selectedProduct.id
          ? {
            ...p,
            name: editForm.name,
            description: editForm.description || null,
            category: editForm.category || null,
            sale_price: parseFloat(editForm.price),
            cost_price: editForm.cost ? parseFloat(editForm.cost) : null,
            stock_quantity: parseInt(editForm.stock_quantity),
            min_stock: parseInt(editForm.min_stock_level),
            barcode: editForm.barcode || null
          }
          : p
      ))
      setMessage({ type: 'success', text: 'Produto atualizado!' })
      setShowEditDrawer(false)
    } else {
      setMessage({ type: 'error', text: 'Erro ao atualizar.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDelete = (product: Product) => {
    setSelectedProduct(product)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedProduct) return
    setIsSaving(true)

    const { error } = await (supabase as any)
      .from('products')
      .delete()
      .eq('id', selectedProduct.id)

    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id))
      setMessage({ type: 'success', text: 'Produto excluído!' })
      setShowDeleteModal(false)
    } else {
      setMessage({ type: 'error', text: 'Erro ao excluir.' })
    }

    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      category: '',
      price: '',
      cost: '',
      stock_quantity: '',
      min_stock_level: '10',
      unit: 'un',
      barcode: ''
    })
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchCategory = filterCategory === 'all' || p.category === filterCategory
    const matchLowStock = !showLowStock || p.stock_quantity <= p.min_stock

    return matchSearch && matchCategory && matchLowStock
  })

  // Calcular estatísticas
  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock)
  const totalValue = products.reduce((sum, p) => sum + ((p.sale_price || 0) * p.stock_quantity), 0)
  const totalCost = products.reduce((sum, p) => sum + ((p.cost_price || 0) * p.stock_quantity), 0)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
              } text-white`}
          >
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Estoque</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm">Gestão de produtos e inventário</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchProducts} disabled={isLoading} className="p-2.5 bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-50 shadow-sm">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreateDrawer(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1c1c1f] rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-slate-500 dark:text-gray-400 text-sm font-medium mb-1">Total de Produtos</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{products.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1c1c1f] rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-slate-500 dark:text-gray-400 text-sm font-medium mb-1">Estoque Baixo</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{lowStockProducts.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1c1c1f] rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-slate-500 dark:text-gray-400 text-sm font-medium mb-1">Valor do Estoque</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalValue)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-[#1c1c1f] rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-slate-500 dark:text-gray-400 text-sm font-medium mb-1">Custo do Estoque</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalCost)}</p>
        </motion.div>
      </div>

      {/* Alertas de Estoque Baixo */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-gradient-to-r dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-800 dark:text-amber-400 font-bold mb-1">Atenção Necessária: Estoque Crítico</h3>
              <p className="text-sm text-amber-700/80 dark:text-amber-200/70 mb-3">
                {lowStockProducts.length} produto{lowStockProducts.length > 1 ? 's estão' : ' está'} com o nível de estoque abaixo do limite mínimo configurado. Recomendamos a reposição para evitar indisponibilidade.
              </p>
              <div className="flex flex-wrap gap-2">
                {lowStockProducts.slice(0, 5).map(p => (
                  <span key={p.id} className="px-3 py-1 bg-white dark:bg-amber-500/20 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 shadow-sm">
                    {p.name}: <span className="font-bold">{p.stock_quantity} un</span> (Min: {p.min_stock})
                  </span>
                ))}
                {lowStockProducts.length > 5 && (
                  <span className="px-3 py-1 bg-white dark:bg-amber-500/20 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 shadow-sm">
                    + {lowStockProducts.length - 5} outros itens
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
        >
          <option value="all">Todas Categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${showLowStock
            ? 'bg-amber-500 text-white border border-transparent'
            : 'bg-white dark:bg-[#1c1c1f] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
            }`}
        >
          Filtrar Baixo Estoque
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Products Table */}
      {!isLoading && filteredProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1c1c1f] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Estoque Atual</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Preço Venda</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Custo Unitário</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredProducts.map((product) => {
                  const isLowStock = product.stock_quantity <= product.min_stock
                  const stockPercentage = (product.stock_quantity / (product.min_stock * 2)) * 100

                  return (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLowStock ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-100 dark:bg-white/5'}`}>
                            <Package className={`w-5 h-5 ${isLowStock ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500 dark:text-gray-400'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{product.name}</p>
                              {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">{product.category || 'Sem categoria'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 max-w-[150px]">
                          <div className="flex justify-between items-center text-xs">
                            <span className={`font-bold ${isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {product.stock_quantity} un
                            </span>
                            <span className="text-slate-400 dark:text-gray-500">Min: {product.min_stock}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm font-medium text-slate-700 dark:text-gray-300">{formatCurrency(product.sale_price)}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-slate-500 dark:text-gray-500">{product.cost_price ? formatCurrency(product.cost_price) : '--'}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(product)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all" title="Editar">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(product)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && (
        <div className="bg-white dark:bg-[#1c1c1f] rounded-[2rem] border border-slate-200 dark:border-white/5 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-slate-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhum produto cadastrado</h3>
          <p className="text-slate-500 dark:text-gray-400 text-sm mb-8 max-w-sm mx-auto">
            {searchTerm || filterCategory !== 'all'
              ? 'Não encontramos nenhum produto com os filtros aplicados no momento.'
              : 'Gerencie seu inventário de forma inteligente. Comece cadastrando seu primeiro produto.'
            }
          </p>
          {!searchTerm && filterCategory === 'all' && (
            <button onClick={() => setShowCreateDrawer(true)} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
              Cadastrar Primeiro Produto
            </button>
          )}
        </div>
      )}

      {/* Create Drawer */}
      <AnimatePresence>
        {showCreateDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowCreateDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-3 right-3 bottom-3 w-full max-w-md bg-white dark:bg-[#0f1419] z-50 shadow-2xl flex flex-col rounded-[2rem] border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Novo Produto</h2>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Adicionar ao inventário</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateDrawer(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-2">Informações Básicas</h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Nome *</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Ex: Shampoo Hidratante 500ml"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Categoria</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Código de Barras</label>
                    <input
                      type="text"
                      value={createForm.barcode}
                      onChange={(e) => setCreateForm({ ...createForm, barcode: e.target.value })}
                      placeholder="EAN/UPC (Opcional)"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />
                  </div>
                </div>

                {/* Precificação */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-2">Valores</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Preço Venda *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={createForm.price}
                          onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Custo</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={createForm.cost}
                          onChange={(e) => setCreateForm({ ...createForm, cost: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estoque */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-2">Controle de Estoque</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Qtd Atual *</label>
                      <input
                        type="number"
                        min="0"
                        value={createForm.stock_quantity}
                        onChange={(e) => setCreateForm({ ...createForm, stock_quantity: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Unidade</label>
                      <select
                        value={createForm.unit}
                        onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                      >
                        {units.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Alerta de Estoque Mínimo</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.min_stock_level}
                      onChange={(e) => setCreateForm({ ...createForm, min_stock_level: e.target.value })}
                      placeholder="10"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">O sistema avisará quando o estoque chegar neste nível.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Descrição</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Detalhes adicionais sobre o produto..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none shadow-sm"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-white/5 space-y-3 bg-slate-50/50 dark:bg-transparent rounded-b-[2rem]">
                <button
                  onClick={handleCreate}
                  disabled={isSaving || !createForm.name || !createForm.price || !createForm.stock_quantity}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Finalizar Cadastro
                </button>
                <button onClick={() => setShowCreateDrawer(false)} className="w-full px-6 py-3 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Drawer */}
      <AnimatePresence>
        {showEditDrawer && selectedProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowEditDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-3 right-3 bottom-3 w-full max-w-md bg-white dark:bg-[#0f1419] z-50 shadow-2xl flex flex-col rounded-[2rem] border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar Produto</h2>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{selectedProduct.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowEditDrawer(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-2">Informações Básicas</h3>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Nome *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Categoria</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-2">Valores</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Preço Venda *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Custo</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.cost}
                          onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-2">Controle de Estoque</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Quantidade *</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.stock_quantity}
                        onChange={(e) => setEditForm({ ...editForm, stock_quantity: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Unidade</label>
                      <select
                        value={editForm.unit}
                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                      >
                        {units.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Alerta de Estoque Mínimo</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.min_stock_level}
                      onChange={(e) => setEditForm({ ...editForm, min_stock_level: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Descrição</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1a2332] border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none shadow-sm"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-white/5 space-y-3 bg-slate-50/50 dark:bg-transparent rounded-b-[2rem]">
                <button onClick={handleSaveEdit} disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Salvar Alterações
                </button>
                <button onClick={() => setShowEditDrawer(false)} className="w-full px-6 py-3 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1c1c1f] rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-slate-200 dark:border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Excluir Produto</h2>
              <p className="text-slate-500 dark:text-gray-400 text-sm text-center mb-8 leading-relaxed">
                Tem certeza que deseja excluir <strong className="text-slate-900 dark:text-white">{selectedProduct.name}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors font-medium shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
