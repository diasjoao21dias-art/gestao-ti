import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Plus, Edit, Trash2, Monitor, Cpu, Search, ChevronDown, ChevronUp } from 'lucide-react'
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
}

interface Componente {
  id: number
  maquina_id: number
  tipo: string
  descricao: string
  marca: string
  modelo: string
  numero_serie: string
  capacidade: string
  observacoes: string
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
  const [componentes, setComponentes] = useState<Componente[]>([])
  const [loadingComponentes, setLoadingComponentes] = useState(false)
  const [showComponenteModal, setShowComponenteModal] = useState(false)
  const [editingComponenteId, setEditingComponenteId] = useState<number | null>(null)
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
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">Nenhum componente cadastrado</p>
                  ) : (
                    <div className="space-y-2">
                      {componentes.map((comp) => (
                        <div key={comp.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between border border-gray-200 dark:border-gray-700">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">
                                {comp.tipo}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{comp.descricao}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {comp.marca && <span>Marca: {comp.marca}</span>}
                              {comp.modelo && <span>Modelo: {comp.modelo}</span>}
                              {comp.capacidade && <span>Capacidade: {comp.capacidade}</span>}
                              {comp.numero_serie && <span>S/N: {comp.numero_serie}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Tooltip text="Editar componente">
                              <button
                                onClick={() => handleOpenComponenteModal(comp)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              >
                                <Edit className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                              </button>
                            </Tooltip>
                            <Tooltip text="Excluir componente">
                              <button
                                onClick={() => handleDeleteComponente(comp.id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
