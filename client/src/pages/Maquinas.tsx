import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Plus, Edit, Trash2, Monitor, Cpu, Search, ChevronDown, ChevronUp, Wrench, Calendar } from 'lucide-react'
import Modal from '../components/Modal'
import Tooltip from '../components/Tooltip'
import { useToast } from '../context/ToastContext'

interface Maquina {
  id: number
  nome: string
  ip: string
  setor_id: number | null
  setor_nome: string
  usuario_id: number | null
  usuario_nome: string
  sistema_operacional: string
  observacoes: string
  total_componentes: number
  ultima_manutencao?: string
  proxima_manutencao?: string
  frequencia_manutencao_meses?: number
}

interface Manutencao {
  id: number
  tipo: string
  data_manutencao: string
  proxima_manutencao: string
  descricao: string
  tecnico_nome: string
}

interface FormData {
  nome: string
  ip: string
  setor: string
  usuario: string
  sistema_operacional: string
  observacoes: string
}

interface ComponenteForm {
  tipo: string
  descricao: string
  marca: string
  modelo: string
  numero_serie: string
  capacidade: string
  observacoes: string
}

const tiposComponente = [
  'Processador',
  'Memória RAM',
  'HD/SSD',
  'Placa Mãe',
  'Placa de Vídeo',
  'Fonte',
  'Monitor',
  'Teclado',
  'Mouse',
  'Impressora',
  'Outros'
]

export default function Maquinas() {
  const toast = useToast()
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    ip: '',
    setor: '',
    usuario: '',
    sistema_operacional: '',
    observacoes: ''
  })

  const [expandedMaquina, setExpandedMaquina] = useState<number | null>(null)
  const [componentes, setComponentes] = useState<any[]>([])
  const [loadingComponentes, setLoadingComponentes] = useState(false)
  const [showComponenteModal, setShowComponenteModal] = useState(false)
  const [editingComponenteId, setEditingComponenteId] = useState<number | null>(null)
  
  // Novos estados para Manutenção
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [loadingManutencoes, setLoadingManutencoes] = useState(false)
  const [showManutencaoModal, setShowManutencaoModal] = useState(false)
  const [manutencaoForm, setManutencaoForm] = useState({
    tipo: 'preventiva',
    data_manutencao: new Date().toISOString().split('T')[0],
    descricao: '',
    frequencia_meses: 6
  })
  const [componenteForm, setComponenteForm] = useState<ComponenteForm>({
    tipo: '',
    descricao: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    capacidade: '',
    observacoes: ''
  })

  useEffect(() => {
    loadMaquinas()
  }, [])

  const loadMaquinas = async () => {
    try {
      const data = await api.maquinas.getAll()
      setMaquinas(data)
    } catch (error) {
      console.error('Erro ao carregar máquinas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadManutencoes = async (maquinaId: number) => {
    setLoadingManutencoes(true)
    try {
      const response = await fetch(`/api/maquinas/${maquinaId}/manutencoes`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      setManutencoes(data)
    } catch (error) {
      console.error('Erro ao carregar manutenções:', error)
    } finally {
      setLoadingManutencoes(false)
    }
  }

  const handleToggleExpand = async (maquinaId: number) => {
    if (expandedMaquina === maquinaId) {
      setExpandedMaquina(null)
      setComponentes([])
      setManutencoes([])
    } else {
      setExpandedMaquina(maquinaId)
      await Promise.all([
        loadComponentes(maquinaId),
        loadManutencoes(maquinaId)
      ])
    }
  }

  const handleOpenManutencaoModal = () => {
    const maquina = maquinas.find(m => m.id === expandedMaquina)
    setManutencaoForm({
      tipo: 'preventiva',
      data_manutencao: new Date().toISOString().split('T')[0],
      descricao: '',
      frequencia_meses: maquina?.frequencia_manutencao_meses || 6
    })
    setShowManutencaoModal(true)
  }

  const handleSubmitManutencao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expandedMaquina) return
    try {
      const response = await fetch(`/api/maquinas/${expandedMaquina}/manutencoes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(manutencaoForm)
      })
      if (response.ok) {
        toast.success('Manutenção registrada com sucesso!')
        setShowManutencaoModal(false)
        loadManutencoes(expandedMaquina)
        loadMaquinas()
      }
    } catch (error) {
      toast.error('Erro ao registrar manutenção')
    }
  }

  const loadComponentes = async (maquinaId: number) => {
    setLoadingComponentes(true)
    try {
      const data = await api.maquinas.getComponentes(maquinaId)
      setComponentes(data)
    } catch (error) {
      console.error('Erro ao carregar componentes:', error)
    } finally {
      setLoadingComponentes(false)
    }
  }

  const handleToggleExpand = async (maquinaId: number) => {
    if (expandedMaquina === maquinaId) {
      setExpandedMaquina(null)
      setComponentes([])
    } else {
      setExpandedMaquina(maquinaId)
      await loadComponentes(maquinaId)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir esta máquina?')) {
      try {
        await api.maquinas.delete(id)
        toast.success('Máquina excluída com sucesso!')
        loadMaquinas()
      } catch (error) {
        console.error('Erro ao excluir máquina:', error)
        toast.error('Não foi possível excluir a máquina. Tente novamente.')
      }
    }
  }

  const handleOpenModal = (maquina?: Maquina) => {
    if (maquina) {
      setEditingId(maquina.id)
      setFormData({
        nome: maquina.nome || '',
        ip: maquina.ip || '',
        setor: maquina.setor_nome || '',
        usuario: maquina.usuario_nome || '',
        sistema_operacional: maquina.sistema_operacional || '',
        observacoes: maquina.observacoes || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        nome: '',
        ip: '',
        setor: '',
        usuario: '',
        sistema_operacional: '',
        observacoes: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.maquinas.update(editingId, formData)
        toast.success('Máquina atualizada com sucesso!')
      } else {
        await api.maquinas.create(formData)
        toast.success('Máquina cadastrada com sucesso!')
      }
      setShowModal(false)
      loadMaquinas()
    } catch (error) {
      console.error('Erro ao salvar máquina:', error)
      toast.error('Não foi possível salvar a máquina. Verifique os dados e tente novamente.')
    }
  }

  const handleOpenComponenteModal = (componente?: Componente) => {
    if (componente) {
      setEditingComponenteId(componente.id)
      setComponenteForm({
        tipo: componente.tipo || '',
        descricao: componente.descricao || '',
        marca: componente.marca || '',
        modelo: componente.modelo || '',
        numero_serie: componente.numero_serie || '',
        capacidade: componente.capacidade || '',
        observacoes: componente.observacoes || ''
      })
    } else {
      setEditingComponenteId(null)
      setComponenteForm({
        tipo: '',
        descricao: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        capacidade: '',
        observacoes: ''
      })
    }
    setShowComponenteModal(true)
  }

  const handleSubmitComponente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expandedMaquina) return
    
    try {
      if (editingComponenteId) {
        await api.maquinas.updateComponente(editingComponenteId, componenteForm)
        toast.success('Componente atualizado com sucesso!')
      } else {
        await api.maquinas.addComponente(expandedMaquina, componenteForm)
        toast.success('Componente adicionado com sucesso!')
      }
      setShowComponenteModal(false)
      loadComponentes(expandedMaquina)
      loadMaquinas()
    } catch (error) {
      console.error('Erro ao salvar componente:', error)
      toast.error('Não foi possível salvar o componente. Tente novamente.')
    }
  }

  const handleDeleteComponente = async (id: number) => {
    if (confirm('Deseja realmente excluir este componente?')) {
      try {
        await api.maquinas.deleteComponente(id)
        toast.success('Componente excluído com sucesso!')
        if (expandedMaquina) {
          loadComponentes(expandedMaquina)
          loadMaquinas()
        }
      } catch (error) {
        console.error('Erro ao excluir componente:', error)
        toast.error('Não foi possível excluir o componente. Tente novamente.')
      }
    }
  }

  const filteredMaquinas = maquinas.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.setor_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.usuario_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Máquinas na Rede</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie todas as máquinas cadastradas na rede</p>
        </div>
        <Tooltip text="Cadastrar uma nova máquina na rede" position="left">
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Máquina
          </button>
        </Tooltip>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, IP, setor ou usuário..."
            className="input pl-10 w-full"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredMaquinas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <Monitor className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma máquina encontrada</p>
          </div>
        ) : (
          filteredMaquinas.map((maquina) => (
            <div key={maquina.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-lg">
                    <Monitor className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{maquina.nome}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                      {maquina.ip && <span>IP: {maquina.ip}</span>}
                      {maquina.setor_nome && <span>Setor: {maquina.setor_nome}</span>}
                      {maquina.usuario_nome && <span>Usuário: {maquina.usuario_nome}</span>}
                      {maquina.ultima_manutencao && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                          <Wrench className="w-3 h-3" />
                          Última: {new Date(maquina.ultima_manutencao).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {maquina.proxima_manutencao && (
                        <span className={`flex items-center gap-1 font-medium ${
                          new Date(maquina.proxima_manutencao) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          Próxima: {new Date(maquina.proxima_manutencao).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    {maquina.sistema_operacional && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{maquina.sistema_operacional}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                    {maquina.total_componentes} componentes
                  </span>
                  <Tooltip text={expandedMaquina === maquina.id ? "Ocultar componentes" : "Ver peças e componentes desta máquina"}>
                    <button
                      onClick={() => handleToggleExpand(maquina.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {expandedMaquina === maquina.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                  </Tooltip>
                  <Tooltip text="Editar informações da máquina">
                    <button
                      onClick={() => handleOpenModal(maquina)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </button>
                  </Tooltip>
                  <Tooltip text="Excluir esta máquina">
                    <button
                      onClick={() => handleDelete(maquina.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </button>
                  </Tooltip>
                </div>
              </div>
              
              {expandedMaquina === maquina.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Componentes Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Cpu className="w-4 h-4" />
                          Componentes
                        </h4>
                        <button
                          onClick={() => handleOpenComponenteModal()}
                          className="btn btn-outline btn-sm flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar
                        </button>
                      </div>
                      
                      {loadingComponentes ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      ) : componentes.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">Nenhum componente cadastrado</p>
                      ) : (
                        <div className="space-y-2">
                          {componentes.map((comp) => (
                            <div key={comp.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between border border-gray-200 dark:border-gray-700">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">
                                    {comp.tipo}
                                  </span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{comp.descricao}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-3 text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                  {comp.marca && <span>M: {comp.marca}</span>}
                                  {comp.capacidade && <span>C: {comp.capacidade}</span>}
                                  {comp.numero_serie && <span>S/N: {comp.numero_serie}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenComponenteModal(comp)}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                  <Edit className="w-3.5 h-3.5 text-primary-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteComponente(comp.id)}
                                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Manutenções Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Histórico de Manutenções
                        </h4>
                        <button
                          onClick={handleOpenManutencaoModal}
                          className="btn btn-primary btn-sm flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Registrar
                        </button>
                      </div>

                      {loadingManutencoes ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      ) : manutencoes.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">Nenhuma manutenção registrada</p>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                          {manutencoes.map((man) => (
                            <div key={man.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  man.tipo === 'preventiva' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {man.tipo}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(man.data_manutencao).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">{man.descricao}</p>
                              <div className="flex justify-between items-center text-[10px] text-gray-500">
                                <span>Téc: {man.tecnico_nome}</span>
                                <span className="text-blue-600">Prox: {new Date(man.proxima_manutencao).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar Máquina' : 'Nova Máquina'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Máquina *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="input w-full"
                required
                placeholder="Ex: PC-RECEPCAO-01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Endereço IP
              </label>
              <input
                type="text"
                value={formData.ip}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '')
                  setFormData({ ...formData, ip: value })
                }}
                className="input w-full"
                placeholder="Ex: 192.168.1.100"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Setor
              </label>
              <input
                type="text"
                value={formData.setor}
                onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                className="input w-full"
                placeholder="Ex: TI, Financeiro, RH..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuário Responsável
              </label>
              <input
                type="text"
                value={formData.usuario}
                onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                className="input w-full"
                placeholder="Nome do responsável pela máquina"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sistema Operacional
              </label>
              <input
                type="text"
                value={formData.sistema_operacional}
                onChange={(e) => setFormData({ ...formData, sistema_operacional: e.target.value })}
                className="input w-full"
                placeholder="Ex: Windows 11 Pro"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="input w-full"
              rows={3}
              placeholder="Informações adicionais..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showManutencaoModal}
        onClose={() => setShowManutencaoModal(false)}
        title="Registrar Manutenção"
      >
        <form onSubmit={handleSubmitManutencao} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo *
              </label>
              <select
                value={manutencaoForm.tipo}
                onChange={(e) => setManutencaoForm({ ...manutencaoForm, tipo: e.target.value })}
                className="input w-full"
                required
              >
                <option value="preventiva">Preventiva</option>
                <option value="corretiva">Corretiva</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data da Manutenção *
              </label>
              <input
                type="date"
                value={manutencaoForm.data_manutencao}
                onChange={(e) => setManutencaoForm({ ...manutencaoForm, data_manutencao: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequência para Próxima (Meses)
              </label>
              <input
                type="number"
                value={manutencaoForm.frequencia_meses}
                onChange={(e) => setManutencaoForm({ ...manutencaoForm, frequencia_meses: parseInt(e.target.value) })}
                className="input w-full"
                min="1"
                max="60"
              />
              <p className="text-[10px] text-gray-400 mt-1">O sistema calculará automaticamente a data da próxima manutenção preventiva.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição do Serviço *
            </label>
            <textarea
              value={manutencaoForm.descricao}
              onChange={(e) => setManutencaoForm({ ...manutencaoForm, descricao: e.target.value })}
              className="input w-full"
              rows={4}
              required
              placeholder="Descreva o que foi feito na manutenção..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowManutencaoModal(false)}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar Registro
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showComponenteModal}
        onClose={() => setShowComponenteModal(false)}
        title={editingComponenteId ? 'Editar Componente' : 'Novo Componente'}
      >
        <form onSubmit={handleSubmitComponente} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo *
              </label>
              <select
                value={componenteForm.tipo}
                onChange={(e) => setComponenteForm({ ...componenteForm, tipo: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">Selecione o tipo</option>
                {tiposComponente.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição *
              </label>
              <input
                type="text"
                value={componenteForm.descricao}
                onChange={(e) => setComponenteForm({ ...componenteForm, descricao: e.target.value })}
                className="input w-full"
                required
                placeholder="Ex: Intel Core i7-12700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={componenteForm.marca}
                onChange={(e) => setComponenteForm({ ...componenteForm, marca: e.target.value })}
                className="input w-full"
                placeholder="Ex: Intel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={componenteForm.modelo}
                onChange={(e) => setComponenteForm({ ...componenteForm, modelo: e.target.value })}
                className="input w-full"
                placeholder="Ex: i7-12700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Capacidade
              </label>
              <input
                type="text"
                value={componenteForm.capacidade}
                onChange={(e) => setComponenteForm({ ...componenteForm, capacidade: e.target.value })}
                className="input w-full"
                placeholder="Ex: 16GB, 512GB, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de Série
              </label>
              <input
                type="text"
                value={componenteForm.numero_serie}
                onChange={(e) => setComponenteForm({ ...componenteForm, numero_serie: e.target.value })}
                className="input w-full"
                placeholder="S/N do componente"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={componenteForm.observacoes}
              onChange={(e) => setComponenteForm({ ...componenteForm, observacoes: e.target.value })}
              className="input w-full"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowComponenteModal(false)}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingComponenteId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
