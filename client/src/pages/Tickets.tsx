import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Edit, Trash2, Search, X, LayoutGrid, Table as TableIcon, User as UserIcon, Users } from 'lucide-react'
import FiltrosAvancados from '../components/FiltrosAvancados'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../context/AuthContext'
import TicketKanban from '../components/TicketKanban'
import Tooltip from '../components/Tooltip'
import { useToast } from '../context/ToastContext'

interface FormData {
  titulo: string
  descricao: string
  prioridade: string
  status: string
  categoria: string
  solicitante_id: string
  setor_id: string
  ativo_id: string
  servico_solicitado: string
  setor_texto: string
  ramal: string
  cdc: string
}

export default function Tickets() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [tickets, setTickets] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [setores, setSetores] = useState<any[]>([])
  const [ativos, setAtivos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [filtrosAtivos, setFiltrosAtivos] = useState<any>({})
  const [visualizacao, setVisualizacao] = useState<'tabela' | 'kanban'>('kanban')
  const [filtroRapido, setFiltroRapido] = useState<'todos' | 'meus' | 'atribuidos'>('todos')
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    descricao: '',
    prioridade: 'media',
    status: 'aberto',
    categoria: '',
    solicitante_id: '',
    setor_id: '',
    ativo_id: '',
    servico_solicitado: '',
    setor_texto: '',
    ramal: '',
    cdc: ''
  })

  useEffect(() => {
    loadTickets()
    loadUsuarios()
    loadSetores()
    loadAtivos()
  }, [])

  const loadTickets = async () => {
    try {
      const data = await api.tickets.getAll()
      setTickets(data)
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
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

  const loadSetores = async () => {
    try {
      const response = await fetch('/api/setores', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSetores(data);
      }
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const loadAtivos = async () => {
    try {
      const data = await api.ativos.getAll()
      setAtivos(data)
    } catch (error) {
      console.error('Erro ao carregar ativos:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir este ticket?')) {
      try {
        await api.tickets.delete(id)
        toast.success('Ticket excluído com sucesso!')
        loadTickets()
      } catch (error) {
        console.error('Erro ao excluir ticket:', error)
        toast.error('Não foi possível excluir o ticket. Tente novamente.')
      }
    }
  }

  const handleOpenModal = (ticket?: any) => {
    if (ticket) {
      setEditingId(ticket.id)
      setFormData({
        titulo: ticket.titulo || '',
        descricao: ticket.descricao || '',
        prioridade: ticket.prioridade || 'media',
        status: ticket.status || 'aberto',
        categoria: ticket.categoria || '',
        solicitante_id: ticket.solicitante_id || '',
        setor_id: ticket.setor_id || '',
        ativo_id: ticket.ativo_id || '',
        servico_solicitado: ticket.servico_solicitado || '',
        setor_texto: ticket.setor_texto || '',
        ramal: ticket.ramal || '',
        cdc: ticket.cdc || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        titulo: '',
        descricao: '',
        prioridade: 'media',
        status: 'aberto',
        categoria: '',
        solicitante_id: '',
        setor_id: '',
        ativo_id: '',
        servico_solicitado: '',
        setor_texto: '',
        ramal: '',
        cdc: ''
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
        solicitante_id: formData.solicitante_id ? parseInt(formData.solicitante_id) : user?.id,
        setor_id: formData.setor_id ? parseInt(formData.setor_id) : null,
        ativo_id: formData.ativo_id ? parseInt(formData.ativo_id) : null
      }

      if (editingId) {
        await api.tickets.update(editingId, dataToSend)
        toast.success('Ticket atualizado com sucesso!')
      } else {
        await api.tickets.create(dataToSend)
        toast.success('Ticket criado com sucesso!')
      }
      
      handleCloseModal()
      loadTickets()
    } catch (error) {
      console.error('Erro ao salvar ticket:', error)
      toast.error('Não foi possível salvar o ticket. Verifique os dados e tente novamente.')
    }
  }

  const filtrosConfig = [
    { 
      campo: 'status', 
      label: 'Status', 
      tipo: 'select' as const,
      opcoes: [
        { value: 'aberto', label: 'Aberto' },
        { value: 'em_andamento', label: 'Em Andamento' },
        { value: 'resolvido', label: 'Resolvido' },
        { value: 'fechado', label: 'Fechado' }
      ]
    },
    { 
      campo: 'prioridade', 
      label: 'Prioridade', 
      tipo: 'select' as const,
      opcoes: [
        { value: 'baixa', label: 'Baixa' },
        { value: 'media', label: 'Média' },
        { value: 'alta', label: 'Alta' }
      ]
    },
    { campo: 'categoria', label: 'Categoria', tipo: 'texto' as const },
    { campo: 'criado_em', label: 'Data de Criação', tipo: 'intervalo_data' as const }
  ]

  const aplicarFiltros = (valores: any) => {
    setFiltrosAtivos(valores)
  }

  const limparFiltros = () => {
    setFiltrosAtivos({})
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    if (filtroRapido === 'meus' && ticket.solicitante_id !== user?.id) return false
    if (filtroRapido === 'atribuidos' && ticket.atribuido_a_id !== user?.id) return false

    if (filtrosAtivos.status && ticket.status !== filtrosAtivos.status) return false
    if (filtrosAtivos.prioridade && ticket.prioridade !== filtrosAtivos.prioridade) return false
    if (filtrosAtivos.categoria && !ticket.categoria?.toLowerCase().includes(filtrosAtivos.categoria.toLowerCase())) return false
    
    if (filtrosAtivos.criado_em_inicio) {
      const ticketDate = new Date(ticket.criado_em)
      const inicioDate = new Date(filtrosAtivos.criado_em_inicio)
      if (ticketDate < inicioDate) return false
    }
    
    if (filtrosAtivos.criado_em_fim) {
      const ticketDate = new Date(ticket.criado_em)
      const fimDate = new Date(filtrosAtivos.criado_em_fim)
      if (ticketDate > fimDate) return false
    }

    return true
  })

  if (loading) {
    return <div className="text-center py-12 dark:text-gray-100">Carregando...</div>
  }

  const handleKanbanUpdate = async (ticketId: number, novoStatus: string) => {
    try {
      await api.tickets.update(ticketId, { status: novoStatus })
      toast.success('Status do ticket atualizado!')
      loadTickets()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Não foi possível atualizar o status. Tente novamente.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Helpdesk</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerenciamento de chamados e suporte técnico</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Tooltip text="Ver tickets em formato de cartões organizados por status">
              <button
                onClick={() => setVisualizacao('kanban')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                  visualizacao === 'kanban' 
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Kanban
              </button>
            </Tooltip>
            <Tooltip text="Ver tickets em formato de lista">
              <button
                onClick={() => setVisualizacao('tabela')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                  visualizacao === 'tabela' 
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                Tabela
              </button>
            </Tooltip>
          </div>
          {canCreate('tickets') && (
            <Tooltip text="Abrir um novo chamado de suporte" position="left">
              <button 
                onClick={() => handleOpenModal()}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700"
              >
                <Plus className="w-5 h-5" />
                Novo Ticket
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        {user?.nivel_permissao === 'usuario' ? (
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <UserIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span className="font-medium">Meus Tickets</span>
            <span className="ml-2 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroRapido('todos')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                filtroRapido === 'todos'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Users className="w-4 h-4" />
              Todos
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
                {tickets.length}
              </span>
            </button>
            <button
              onClick={() => setFiltroRapido('meus')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                filtroRapido === 'meus'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Meus Tickets
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
                {tickets.filter(t => t.solicitante_id === user?.id).length}
              </span>
            </button>
            <button
              onClick={() => setFiltroRapido('atribuidos')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                filtroRapido === 'atribuidos'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Atribuídos a Mim
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
                {tickets.filter(t => t.atribuido_a_id === user?.id).length}
              </span>
            </button>
          </div>
        )}
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <FiltrosAvancados
        filtros={filtrosConfig}
        onAplicarFiltros={aplicarFiltros}
        onLimparFiltros={limparFiltros}
      />

      {visualizacao === 'kanban' ? (
        <TicketKanban 
          tickets={filteredTickets}
          onTicketClick={(ticket) => navigate(`/tickets/${ticket.id}`)}
          onStatusChange={handleKanbanUpdate}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Atribuído</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.map((ticket) => (
                <tr 
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">#{ticket.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{ticket.titulo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ticket.categoria || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ticket.solicitante_nome || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ticket.atribuido_nome || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ticket.prioridade === 'alta' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                      ticket.prioridade === 'media' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}>
                      {ticket.prioridade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ticket.status === 'aberto' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                      ticket.status === 'em_andamento' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                      ticket.status === 'resolvido' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canEdit('tickets') && (
                      <Tooltip text="Editar ticket">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenModal(ticket)
                          }}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    )}
                    {canDelete('tickets') && (
                      <Tooltip text="Excluir ticket">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(ticket.id)
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editingId ? 'Editar Ticket' : 'Novo Ticket'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qual serviço você precisa?</label>
                  <input
                    type="text"
                    value={formData.servico_solicitado}
                    onChange={(e) => setFormData({ ...formData, servico_solicitado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Informe seu Setor</label>
                  <input
                    type="text"
                    value={formData.setor_texto}
                    onChange={(e) => setFormData({ ...formData, setor_texto: e.target.value })}
                    placeholder="Digite o nome do seu setor..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ramal</label>
                  <input
                    type="text"
                    value={formData.ramal}
                    onChange={(e) => setFormData({ ...formData, ramal: e.target.value })}
                    placeholder="Digite seu número do ramal..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Informe o CDC</label>
                  <input
                    type="text"
                    value={formData.cdc}
                    onChange={(e) => setFormData({ ...formData, cdc: e.target.value })}
                    placeholder="Campo Opcional, porém se sua OS for pro setor COMPRAS deve-se preencher informando CDC, caso não tenha na sua OS a mesma será invalidada."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição *</label>
                  <textarea
                    required
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={4}
                    placeholder="Faça a descrição detalhada sobre o que precisa ser feito; Se sua OS for pro setor COMPRAS, favor anexar imagem aqui na os e também encaminhar ao Whatsapp do Compras."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className={`grid ${editingId && user?.nivel_permissao !== 'usuario' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
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

                  {editingId && user?.nivel_permissao !== 'usuario' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="aberto">Aberto</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="resolvido">Resolvido</option>
                        <option value="fechado">Fechado</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ativo Relacionado</label>
                  <select
                    value={formData.ativo_id}
                    onChange={(e) => setFormData({ ...formData, ativo_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Nenhum ativo</option>
                    {ativos.map((ativo) => (
                      <option key={ativo.id} value={ativo.id}>
                        {ativo.nome} - {ativo.tipo}
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
    </div>
  )
}
