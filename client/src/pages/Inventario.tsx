import { useState, useEffect } from 'react'
import { 
  Package, Monitor, HardDrive, MapPin, Building, 
  Plus, Search, Edit, Trash2,
  AlertTriangle, Box,
  ArrowUpDown, FileText, HelpCircle, Zap, Settings
} from 'lucide-react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import Alert from '../components/Alert'

interface Ativo {
  id: number
  tipo: string
  categoria_id: number
  categoria_nome: string
  categoria_icone: string
  nome: string
  patrimonio: string
  marca: string
  modelo: string
  numero_serie: string
  data_aquisicao: string
  valor_aquisicao: number
  data_garantia: string
  localizacao_id: number
  localizacao_nome: string
  responsavel_id: number
  responsavel_nome: string
  status: string
  condicao: string
  em_estoque: boolean
  total_componentes: number
}

interface Categoria {
  id: number
  nome: string
  tipo: string
  descricao: string
  icone: string
}

interface Localizacao {
  id: number
  nome: string
  tipo: string
  parent_id: number
  parent_nome: string
  endereco: string
}

interface ItemEstoque {
  id: number
  categoria: string
  nome: string
  descricao: string
  marca: string
  modelo: string
  unidade: string
  quantidade_atual: number
  quantidade_minima: number
  localizacao_nome: string
  valor_unitario: number
}

interface DashboardData {
  ativos: {
    total: number
    em_uso: number
    disponiveis: number
    manutencao: number
    sem_responsavel: number
  }
  garantias: {
    vencidas: number
    proximas_30_dias: number
  }
  licencas: {
    total: number
    usadas: number
    disponiveis: number
    vencendo_30_dias: number
  }
  estoque: {
    abaixo_minimo: number
  }
  por_tipo: { tipo: string; quantidade: number }[]
  por_status: { status: string; quantidade: number }[]
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Package },
  { id: 'equipamentos', label: 'Equipamentos', icon: Monitor },
  { id: 'componentes', label: 'Estoque/Componentes', icon: HardDrive },
  { id: 'localizacoes', label: 'Localizações', icon: MapPin },
]

const statusColors: Record<string, string> = {
  disponivel: 'bg-green-100 text-green-800',
  em_uso: 'bg-blue-100 text-blue-800',
  manutencao: 'bg-yellow-100 text-yellow-800',
  baixado: 'bg-red-100 text-red-800',
  reservado: 'bg-purple-100 text-purple-800',
}

const tipoLocalizacao = [
  { value: 'filial', label: 'Filial' },
  { value: 'andar', label: 'Andar' },
  { value: 'sala', label: 'Sala' },
  { value: 'rack', label: 'Rack' },
]

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1">
    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
    <div className="invisible group-hover:visible absolute z-50 w-64 p-2 mt-1 text-sm text-white bg-gray-800 rounded-lg shadow-lg -left-28 top-5">
      {text}
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
    </div>
  </div>
)

const FormField = ({ 
  label, 
  tooltip, 
  helpText, 
  required, 
  children 
}: { 
  label: string
  tooltip?: string
  helpText?: string
  required?: boolean
  children: React.ReactNode 
}) => (
  <div>
    <label className="flex items-center text-sm font-medium mb-1 dark:text-white">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
    {children}
    {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
  </div>
)

export default function Inventario() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [ativos, setAtivos] = useState<Ativo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([])
  const [estoque, setEstoque] = useState<ItemEstoque[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  
  const [showModalAtivo, setShowModalAtivo] = useState(false)
  const [showModalLocalizacao, setShowModalLocalizacao] = useState(false)
  const [showModalEstoque, setShowModalEstoque] = useState(false)
  const [showModalMovimentacao, setShowModalMovimentacao] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [selectedEstoqueItem, setSelectedEstoqueItem] = useState<ItemEstoque | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLocalizacao, setFilterLocalizacao] = useState('')
  
  const [formData, setFormData] = useState<any>({})
  const [formTab, setFormTab] = useState<'basico' | 'avancado'>('basico')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dashRes, ativosRes, catRes, locRes, estoqueRes, usersRes] = await Promise.all([
        api.inventario.getDashboard(),
        api.ativos.getAll(),
        api.inventario.getCategorias(),
        api.inventario.getLocalizacoes(),
        api.inventario.getEstoque(),
        api.usuarios.getAll(),
      ])
      setDashboard(dashRes)
      setAtivos(ativosRes)
      setCategorias(catRes)
      setLocalizacoes(locRes)
      setEstoque(estoqueRes)
      setUsuarios(usersRes)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAtivo = async () => {
    try {
      if (editingItem) {
        await api.ativos.update(editingItem.id, formData)
        setSuccess('Ativo atualizado com sucesso!')
      } else {
        await api.ativos.create(formData)
        setSuccess('Ativo criado com sucesso!')
      }
      setShowModalAtivo(false)
      setShowQuickAdd(false)
      setEditingItem(null)
      setFormData({})
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSaveLocalizacao = async () => {
    try {
      if (editingItem) {
        await api.inventario.updateLocalizacao(editingItem.id, formData)
        setSuccess('Localização atualizada com sucesso!')
      } else {
        await api.inventario.createLocalizacao(formData)
        setSuccess('Localização criada com sucesso!')
      }
      setShowModalLocalizacao(false)
      setEditingItem(null)
      setFormData({})
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSaveEstoque = async () => {
    try {
      if (editingItem) {
        await api.inventario.updateItemEstoque(editingItem.id, formData)
        setSuccess('Item atualizado com sucesso!')
      } else {
        await api.inventario.createItemEstoque(formData)
        setSuccess('Item criado com sucesso!')
      }
      setShowModalEstoque(false)
      setEditingItem(null)
      setFormData({})
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleMovimentacao = async () => {
    if (!selectedEstoqueItem) return
    try {
      await api.inventario.movimentarEstoque(selectedEstoqueItem.id, formData)
      setSuccess('Movimentação registrada com sucesso!')
      setShowModalMovimentacao(false)
      setSelectedEstoqueItem(null)
      setFormData({})
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteAtivo = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este ativo?')) return
    try {
      await api.ativos.delete(id)
      setSuccess('Ativo excluído com sucesso!')
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteEstoque = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este item de estoque?')) return
    try {
      await api.inventario.deleteItemEstoque(id)
      setSuccess('Item de estoque excluído com sucesso!')
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteLocalizacao = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta localização?')) return
    try {
      await api.inventario.deleteLocalizacao(id)
      setSuccess('Localização excluída com sucesso!')
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const filteredAtivos = ativos.filter(a => {
    const matchSearch = !searchTerm || 
      a.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.patrimonio?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = !filterCategoria || a.categoria_id?.toString() === filterCategoria
    const matchStatus = !filterStatus || a.status === filterStatus
    const matchLocalizacao = !filterLocalizacao || a.localizacao_id?.toString() === filterLocalizacao
    return matchSearch && matchCategoria && matchStatus && matchLocalizacao
  })

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Controle de Inventário
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gestão completa de equipamentos, componentes e localizações
          </p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-300">Dica rápida</p>
            <p className="text-blue-700 dark:text-blue-400 mt-1">
              {activeTab === 'dashboard' && 'Este painel mostra um resumo geral do seu inventário. Clique nas outras abas para gerenciar equipamentos, estoque ou localizações.'}
              {activeTab === 'equipamentos' && 'Aqui você cadastra e gerencia seus equipamentos de TI. Use o botão "Cadastro Rápido" para adicionar equipamentos de forma simplificada.'}
              {activeTab === 'componentes' && 'Gerencie peças sobressalentes e acessórios. Clique no ícone de setas para registrar entradas e saídas do estoque.'}
              {activeTab === 'localizacoes' && 'Cadastre os locais onde seus equipamentos ficam (prédios, andares, salas). Isso ajuda a organizar e localizar os ativos.'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total de Ativos</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard.ativos.total}</p>
                </div>
                <Package className="w-12 h-12 text-blue-500" />
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <span className="text-green-600">{dashboard.ativos.disponiveis} disponíveis</span>
                <span className="text-blue-600">{dashboard.ativos.em_uso} em uso</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Garantias</p>
                  <p className="text-3xl font-bold text-red-600">{dashboard.garantias.vencidas}</p>
                  <p className="text-sm text-gray-500">vencidas</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              <div className="mt-2 text-sm text-yellow-600">
                {dashboard.garantias.proximas_30_dias} vencendo em 30 dias
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Licenças</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {dashboard.licencas.usadas}/{dashboard.licencas.total}
                  </p>
                  <p className="text-sm text-gray-500">em uso</p>
                </div>
                <FileText className="w-12 h-12 text-purple-500" />
              </div>
              <div className="mt-2 text-sm">
                <span className="text-green-600">{dashboard.licencas.disponiveis} disponíveis</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sem Responsável</p>
                  <p className="text-3xl font-bold text-orange-600">{dashboard.ativos.sem_responsavel}</p>
                  <p className="text-sm text-gray-500">ativos</p>
                </div>
                <Box className="w-12 h-12 text-orange-500" />
              </div>
              <div className="mt-2 text-sm text-yellow-600">
                {dashboard.estoque.abaixo_minimo} itens abaixo do mínimo
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Ativos por Tipo</h3>
              <div className="space-y-3">
                {dashboard.por_tipo.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300 capitalize">{item.tipo}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(item.quantidade / dashboard.ativos.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium w-8 text-right">
                        {item.quantidade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Ativos por Status</h3>
              <div className="space-y-3">
                {dashboard.por_status.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm ${statusColors[item.status] || 'bg-gray-100'}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">{item.quantidade}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'equipamentos' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, série, patrimônio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white w-64"
                />
              </div>
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">Todas categorias</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">Todos status</option>
                <option value="disponivel">Disponível</option>
                <option value="em_uso">Em Uso</option>
                <option value="manutencao">Manutenção</option>
                <option value="baixado">Baixado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingItem(null)
                  setFormData({ status: 'disponivel', condicao: 'bom', em_estoque: true })
                  setShowQuickAdd(true)
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                title="Cadastro rápido com apenas os campos essenciais"
              >
                <Zap className="w-4 h-4" />
                Cadastro Rápido
              </button>
              <button
                onClick={() => {
                  setEditingItem(null)
                  setFormData({ status: 'disponivel', condicao: 'bom', em_estoque: true })
                  setFormTab('basico')
                  setShowModalAtivo(true)
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                title="Cadastro completo com todos os campos"
              >
                <Settings className="w-4 h-4" />
                Cadastro Completo
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Patrimônio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Marca/Modelo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Responsável</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Garantia</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAtivos.map(ativo => (
                    <tr key={ativo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {ativo.patrimonio || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{ativo.nome}</div>
                        <div className="text-xs text-gray-500">{ativo.numero_serie}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {ativo.categoria_nome || ativo.tipo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {ativo.marca} {ativo.modelo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {ativo.responsavel_nome || <span className="text-orange-500">Sem responsável</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[ativo.status]}`}>
                          {ativo.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {ativo.data_garantia ? (
                          new Date(ativo.data_garantia) < new Date() ? (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" />
                              Vencida
                            </span>
                          ) : (
                            <span className="text-green-600">
                              {new Date(ativo.data_garantia).toLocaleDateString('pt-BR')}
                            </span>
                          )
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(ativo)
                              setFormData(ativo)
                              setFormTab('basico')
                              setShowModalAtivo(true)
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar ativo"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAtivo(ativo.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Excluir ativo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'componentes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Estoque de Componentes e Acessórios</h2>
            <button
              onClick={() => {
                setEditingItem(null)
                setFormData({ quantidade_atual: 0, quantidade_minima: 0, unidade: 'unidade' })
                setShowModalEstoque(true)
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Novo Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {estoque.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-gray-500 uppercase">{item.categoria}</span>
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.nome}</h3>
                    <p className="text-sm text-gray-500">{item.marca} {item.modelo}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedEstoqueItem(item)
                        setFormData({ tipo: 'entrada', quantidade: 1 })
                        setShowModalMovimentacao(true)
                      }}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Registrar entrada ou saída de estoque"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingItem(item)
                        setFormData(item)
                        setShowModalEstoque(true)
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Editar item"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEstoque(item.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Excluir item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{item.quantidade_atual}</span>
                    <span className="text-sm text-gray-500 ml-1">{item.unidade}(s)</span>
                  </div>
                  {item.quantidade_atual < item.quantidade_minima && (
                    <span className="flex items-center gap-1 text-red-600 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      Estoque baixo
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Mínimo: {item.quantidade_minima} | Local: {item.localizacao_nome || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'localizacoes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Estrutura de Localizações</h2>
            <button
              onClick={() => {
                setEditingItem(null)
                setFormData({ tipo: 'filial' })
                setShowModalLocalizacao(true)
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nova Localização
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Localização Pai</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Endereço</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {localizacoes.map(loc => (
                    <tr key={loc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{loc.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 capitalize">{loc.tipo}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{loc.parent_nome || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{loc.endereco || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(loc)
                              setFormData(loc)
                              setShowModalLocalizacao(true)
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar localização"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLocalizacao(loc.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Excluir localização"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showQuickAdd}
        onClose={() => { setShowQuickAdd(false); setEditingItem(null); setFormData({}) }}
        title="Cadastro Rápido de Ativo"
      >
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-700 dark:text-green-300">
              Preencha apenas os campos essenciais. Você pode adicionar mais detalhes depois editando o ativo.
            </p>
          </div>

          <FormField 
            label="Nome do Equipamento" 
            required 
            tooltip="Digite um nome que identifique o equipamento, ex: 'Notebook Dell TI-001'"
            helpText="Use um nome fácil de identificar"
          >
            <input
              type="text"
              value={formData.nome || ''}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ex: Notebook Dell Latitude"
            />
          </FormField>

          <FormField 
            label="Tipo" 
            required
            tooltip="Escolha o tipo geral do equipamento"
          >
            <select
              value={formData.tipo || ''}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Selecione...</option>
              <option value="hardware">Hardware (Computadores, Notebooks)</option>
              <option value="rede">Rede (Switches, Roteadores)</option>
              <option value="periferico">Periférico (Teclado, Mouse, Monitor)</option>
              <option value="infraestrutura">Infraestrutura (Servidores, Nobreaks)</option>
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField 
              label="Marca"
              tooltip="Fabricante do equipamento"
            >
              <input
                type="text"
                value={formData.marca || ''}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: Dell, HP, Lenovo"
              />
            </FormField>

            <FormField 
              label="Modelo"
              tooltip="Modelo específico do equipamento"
            >
              <input
                type="text"
                value={formData.modelo || ''}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: Latitude 5520"
              />
            </FormField>
          </div>

          <FormField 
            label="Número de Patrimônio"
            tooltip="Código interno de controle da sua empresa (etiqueta no equipamento)"
            helpText="Geralmente é uma etiqueta colada no equipamento"
          >
            <input
              type="text"
              value={formData.patrimonio || ''}
              onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ex: TI-00123"
            />
          </FormField>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => {
                setShowQuickAdd(false)
                setFormTab('basico')
                setShowModalAtivo(true)
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Preciso de mais campos...
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowQuickAdd(false); setFormData({}) }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAtivo}
                disabled={!formData.nome || !formData.tipo}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showModalAtivo}
        onClose={() => { setShowModalAtivo(false); setEditingItem(null); setFormData({}) }}
        title={editingItem ? 'Editar Ativo' : 'Novo Ativo - Cadastro Completo'}
      >
        <div className="space-y-4">
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              onClick={() => setFormTab('basico')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                formTab === 'basico' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Informações Básicas
            </button>
            <button
              onClick={() => setFormTab('avancado')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                formTab === 'avancado' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Informações Avançadas
            </button>
          </div>

          {formTab === 'basico' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField 
                  label="Categoria" 
                  required
                  tooltip="Escolha a categoria do equipamento para melhor organização"
                >
                  <select
                    value={formData.categoria_id || ''}
                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </FormField>
                <FormField 
                  label="Tipo" 
                  required
                  tooltip="Tipo geral: hardware, rede, periférico ou infraestrutura"
                >
                  <select
                    value={formData.tipo || ''}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="hardware">Hardware</option>
                    <option value="rede">Rede</option>
                    <option value="periferico">Periférico</option>
                    <option value="infraestrutura">Infraestrutura</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField 
                  label="Nome" 
                  required
                  tooltip="Nome de identificação do equipamento"
                  helpText="Ex: Notebook Dell Marketing"
                >
                  <input
                    type="text"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </FormField>
                <FormField 
                  label="Patrimônio"
                  tooltip="Número de controle interno da empresa"
                  helpText="Etiqueta colada no equipamento"
                >
                  <input
                    type="text"
                    value={formData.patrimonio || ''}
                    onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField label="Marca" tooltip="Fabricante do equipamento">
                  <input
                    type="text"
                    value={formData.marca || ''}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </FormField>
                <FormField label="Modelo" tooltip="Modelo específico do produto">
                  <input
                    type="text"
                    value={formData.modelo || ''}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </FormField>
                <FormField 
                  label="Nº Série" 
                  tooltip="Número de série único do fabricante"
                  helpText="Geralmente na parte de trás"
                >
                  <input
                    type="text"
                    value={formData.numero_serie || ''}
                    onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField 
                  label="Localização" 
                  tooltip="Onde este equipamento está fisicamente"
                >
                  <select
                    value={formData.localizacao_id || ''}
                    onChange={(e) => setFormData({ ...formData, localizacao_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    {localizacoes.map(l => (
                      <option key={l.id} value={l.id}>{l.nome}</option>
                    ))}
                  </select>
                </FormField>
                <FormField 
                  label="Responsável" 
                  tooltip="Pessoa que está usando ou é responsável pelo equipamento"
                >
                  <select
                    value={formData.responsavel_id || ''}
                    onChange={(e) => setFormData({ ...formData, responsavel_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Sem responsável</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField 
                  label="Status" 
                  tooltip="Situação atual do equipamento"
                >
                  <select
                    value={formData.status || 'disponivel'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_uso">Em Uso</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="baixado">Baixado</option>
                    <option value="reservado">Reservado</option>
                  </select>
                </FormField>
                <FormField 
                  label="Condição" 
                  tooltip="Estado físico do equipamento"
                >
                  <select
                    value={formData.condicao || 'bom'}
                    onChange={(e) => setFormData({ ...formData, condicao: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="novo">Novo</option>
                    <option value="bom">Bom</option>
                    <option value="regular">Regular</option>
                    <option value="ruim">Ruim</option>
                  </select>
                </FormField>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.em_estoque !== false}
                      onChange={(e) => setFormData({ ...formData, em_estoque: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm dark:text-white">Em estoque</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {formTab === 'avancado' && (
            <>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Campos opcionais para controle detalhado do equipamento.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField 
                  label="Data Aquisição" 
                  tooltip="Data em que o equipamento foi comprado"
                >
                  <input
                    type="date"
                    value={formData.data_aquisicao?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, data_aquisicao: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </FormField>
                <FormField 
                  label="Valor (R$)" 
                  tooltip="Quanto custou o equipamento"
                >
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_aquisicao || ''}
                    onChange={(e) => setFormData({ ...formData, valor_aquisicao: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0,00"
                  />
                </FormField>
                <FormField 
                  label="Garantia até" 
                  tooltip="Data de vencimento da garantia"
                  helpText="O sistema alertará quando vencer"
                >
                  <input
                    type="date"
                    value={formData.data_garantia?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, data_garantia: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </FormField>
              </div>

              <FormField 
                label="Observações" 
                tooltip="Anotações adicionais sobre o equipamento"
              >
                <textarea
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Digite aqui qualquer informação adicional..."
                />
              </FormField>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={() => { setShowModalAtivo(false); setEditingItem(null); setFormData({}) }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAtivo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showModalLocalizacao}
        onClose={() => { setShowModalLocalizacao(false); setEditingItem(null); setFormData({}) }}
        title={editingItem ? 'Editar Localização' : 'Nova Localização'}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Localizações ajudam a organizar onde seus equipamentos estão. Use a hierarquia: Filial → Andar → Sala → Rack
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField 
              label="Nome" 
              required
              tooltip="Nome da localização"
              helpText="Ex: Matriz, 3º Andar, Sala TI"
            >
              <input
                type="text"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </FormField>
            <FormField 
              label="Tipo" 
              required
              tooltip="Tipo de localização na hierarquia"
            >
              <select
                value={formData.tipo || ''}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Selecione...</option>
                {tipoLocalizacao.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField 
            label="Localização Pai" 
            tooltip="Se esta localização está dentro de outra, selecione a localização pai"
            helpText="Ex: Uma sala fica dentro de um andar"
          >
            <select
              value={formData.parent_id || ''}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Nenhuma (Raiz)</option>
              {localizacoes.filter(l => l.id !== editingItem?.id).map(l => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </FormField>
          <FormField 
            label="Endereço"
            tooltip="Endereço físico (opcional)"
          >
            <input
              type="text"
              value={formData.endereco || ''}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Rua, número, cidade..."
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => { setShowModalLocalizacao(false); setEditingItem(null); setFormData({}) }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveLocalizacao}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showModalEstoque}
        onClose={() => { setShowModalEstoque(false); setEditingItem(null); setFormData({}) }}
        title={editingItem ? 'Editar Item de Estoque' : 'Novo Item de Estoque'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField 
              label="Categoria" 
              required
              tooltip="Tipo de item de estoque"
            >
              <select
                value={formData.categoria || ''}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="memoria">Memória RAM</option>
                <option value="armazenamento">SSD/HD</option>
                <option value="placa">Placa de Vídeo/Rede</option>
                <option value="cabo">Cabos</option>
                <option value="periferico">Periféricos</option>
                <option value="acessorio">Acessórios</option>
                <option value="fonte">Fontes</option>
              </select>
            </FormField>
            <FormField 
              label="Nome" 
              required
              tooltip="Nome do item"
              helpText="Ex: Memória DDR4 8GB Kingston"
            >
              <input
                type="text"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Marca">
              <input
                type="text"
                value={formData.marca || ''}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </FormField>
            <FormField label="Modelo">
              <input
                type="text"
                value={formData.modelo || ''}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField 
              label="Qtd Atual" 
              tooltip="Quantidade disponível agora"
            >
              <input
                type="number"
                value={formData.quantidade_atual || 0}
                onChange={(e) => setFormData({ ...formData, quantidade_atual: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </FormField>
            <FormField 
              label="Qtd Mínima" 
              tooltip="Quando chegar nessa quantidade, o sistema alerta"
              helpText="Alerta de estoque baixo"
            >
              <input
                type="number"
                value={formData.quantidade_minima || 0}
                onChange={(e) => setFormData({ ...formData, quantidade_minima: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </FormField>
            <FormField label="Unidade">
              <select
                value={formData.unidade || 'unidade'}
                onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="unidade">Unidade</option>
                <option value="metro">Metro</option>
                <option value="caixa">Caixa</option>
                <option value="pacote">Pacote</option>
              </select>
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => { setShowModalEstoque(false); setEditingItem(null); setFormData({}) }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEstoque}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showModalMovimentacao}
        onClose={() => { setShowModalMovimentacao(false); setSelectedEstoqueItem(null); setFormData({}) }}
        title={`Movimentar: ${selectedEstoqueItem?.nome || ''}`}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Entrada:</strong> Adicionar itens ao estoque (compra, doação)<br/>
              <strong>Saída:</strong> Retirar itens do estoque (uso, defeito)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField 
              label="Tipo" 
              required
              tooltip="Entrada adiciona ao estoque, saída remove"
            >
              <select
                value={formData.tipo || 'entrada'}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </FormField>
            <FormField 
              label="Quantidade" 
              required
              tooltip="Quantas unidades estão entrando ou saindo"
            >
              <input
                type="number"
                min="1"
                value={formData.quantidade || 1}
                onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </FormField>
          </div>
          {formData.tipo === 'saida' && (
            <FormField 
              label="Destinatário"
              tooltip="Para quem está sendo entregue (opcional)"
            >
              <select
                value={formData.usuario_destino_id || ''}
                onChange={(e) => setFormData({ ...formData, usuario_destino_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Selecione...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </FormField>
          )}
          <FormField 
            label="Motivo"
            tooltip="Por que está fazendo esta movimentação"
            helpText="Ex: Compra, Instalação, Defeito..."
          >
            <input
              type="text"
              value={formData.motivo || ''}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ex: Compra, Instalação, Defeito..."
            />
          </FormField>
          <FormField label="Observações">
            <textarea
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => { setShowModalMovimentacao(false); setSelectedEstoqueItem(null); setFormData({}) }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleMovimentacao}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
