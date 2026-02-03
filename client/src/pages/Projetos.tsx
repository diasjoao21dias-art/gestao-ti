import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Plus, Edit, Trash2, Search, X, Kanban } from 'lucide-react'
import KanbanBoard from '../components/KanbanBoard'

interface FormData {
  nome: string
  descricao: string
  status: string
  prioridade: string
  data_inicio: string
  data_prevista_fim: string
  data_fim: string
  orcamento: string
  gerente_id: string
  progresso: string
}

export default function Projetos() {
  const [projetos, setProjetos] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showKanban, setShowKanban] = useState(false)
  const [selectedProjeto, setSelectedProjeto] = useState<any>(null)
  const [tarefas, setTarefas] = useState<any[]>([])
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    descricao: '',
    status: 'planejamento',
    prioridade: 'media',
    data_inicio: '',
    data_prevista_fim: '',
    data_fim: '',
    orcamento: '',
    gerente_id: '',
    progresso: '0'
  })

  useEffect(() => {
    loadProjetos()
    loadUsuarios()
  }, [])

  const loadProjetos = async () => {
    try {
      const data = await api.projetos.getAll()
      setProjetos(data)
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsuarios = async () => {
    try {
      const data = await api.usuarios.getAll()
      setUsuarios(data)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const handleOpenKanban = async (projeto: any) => {
    setSelectedProjeto(projeto)
    try {
      const projetoCompleto = await api.projetos.getById(projeto.id)
      setTarefas(projetoCompleto.tarefas || [])
      setShowKanban(true)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      alert('Erro ao carregar tarefas')
    }
  }

  const handleCloseKanban = () => {
    setShowKanban(false)
    setSelectedProjeto(null)
    setTarefas([])
  }

  const handleUpdateTarefa = async (tarefaId: number, newStatus: string) => {
    const projetoId = selectedProjeto?.id
    if (!projetoId) return
    
    try {
      await api.projetos.updateTarefa(tarefaId, { status: newStatus })
      const projetoCompleto = await api.projetos.getById(projetoId)
      setTarefas(projetoCompleto.tarefas || [])
      loadProjetos()
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      alert('Erro ao atualizar tarefa')
    }
  }

  const handleAddTarefa = async (status: string) => {
    const projetoId = selectedProjeto?.id
    if (!projetoId) return
    
    const titulo = prompt('Título da tarefa:')
    if (!titulo) return

    try {
      await api.projetos.addTarefa(projetoId, { 
        titulo, 
        status,
        prioridade: 'media'
      })
      const projetoCompleto = await api.projetos.getById(projetoId)
      setTarefas(projetoCompleto.tarefas || [])
      loadProjetos()
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error)
      alert('Erro ao adicionar tarefa')
    }
  }

  const handleDeleteTarefa = async (tarefaId: number) => {
    const projetoId = selectedProjeto?.id
    if (!projetoId) return
    
    try {
      await api.projetos.deleteTarefa(tarefaId)
      const projetoCompleto = await api.projetos.getById(projetoId)
      setTarefas(projetoCompleto.tarefas || [])
      loadProjetos()
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      alert('Erro ao excluir tarefa')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir este projeto?')) {
      try {
        await api.projetos.delete(id)
        loadProjetos()
      } catch (error) {
        console.error('Erro ao excluir projeto:', error)
        alert('Erro ao excluir projeto')
      }
    }
  }

  const handleOpenModal = (projeto?: any) => {
    if (projeto) {
      setEditingId(projeto.id)
      setFormData({
        nome: projeto.nome || '',
        descricao: projeto.descricao || '',
        status: projeto.status || 'planejamento',
        prioridade: projeto.prioridade || 'media',
        data_inicio: projeto.data_inicio || '',
        data_prevista_fim: projeto.data_prevista_fim || '',
        data_fim: projeto.data_fim || '',
        orcamento: projeto.orcamento || '',
        gerente_id: projeto.gerente_id || '',
        progresso: projeto.progresso?.toString() || '0'
      })
    } else {
      setEditingId(null)
      setFormData({
        nome: '',
        descricao: '',
        status: 'planejamento',
        prioridade: 'media',
        data_inicio: '',
        data_prevista_fim: '',
        data_fim: '',
        orcamento: '',
        gerente_id: '',
        progresso: '0'
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        gerente_id: formData.gerente_id ? parseInt(formData.gerente_id) : null,
        orcamento: formData.orcamento ? parseFloat(formData.orcamento) : null,
        progresso: parseInt(formData.progresso)
      }

      if (editingId) {
        await api.projetos.update(editingId, dataToSend)
      } else {
        await api.projetos.create(dataToSend)
      }
      
      handleCloseModal()
      loadProjetos()
    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
      alert('Erro ao salvar projeto')
    }
  }

  const filteredProjetos = projetos.filter(projeto =>
    projeto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12 dark:text-gray-100">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestão de Projetos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Acompanhamento de projetos de T.I.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Novo Projeto
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjetos.map((projeto) => (
          <div key={projeto.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{projeto.nome}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleOpenKanban(projeto)}
                  className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                  title="Ver Kanban de Tarefas"
                >
                  <Kanban className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleOpenModal(projeto)}
                  className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(projeto.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{projeto.descricao || 'Sem descrição'}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Progresso</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{projeto.progresso}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${projeto.progresso}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                projeto.status === 'planejamento' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                projeto.status === 'em_andamento' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                projeto.status === 'concluido' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
                {projeto.status}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {projeto.gerente_nome || 'Sem gerente'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editingId ? 'Editar Projeto' : 'Novo Projeto'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Projeto *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="planejamento">Planejamento</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade *</label>
                    <select
                      required
                      value={formData.prioridade}
                      onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Início</label>
                    <input
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Previsão de Fim</label>
                    <input
                      type="date"
                      value={formData.data_prevista_fim}
                      onChange={(e) => setFormData({ ...formData, data_prevista_fim: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Fim</label>
                    <input
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Orçamento</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.orcamento}
                      onChange={(e) => setFormData({ ...formData, orcamento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progresso (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progresso}
                      onChange={(e) => setFormData({ ...formData, progresso: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gerente do Projeto</label>
                  <select
                    value={formData.gerente_id}
                    onChange={(e) => setFormData({ ...formData, gerente_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Selecione um gerente</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    {editingId ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showKanban && (
        <KanbanBoard
          tarefas={tarefas}
          onClose={handleCloseKanban}
          onUpdateTarefa={handleUpdateTarefa}
          onAddTarefa={handleAddTarefa}
          onDeleteTarefa={handleDeleteTarefa}
        />
      )}
    </div>
  )
}
