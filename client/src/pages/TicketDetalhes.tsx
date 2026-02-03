import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { ArrowLeft, Clock, User, Tag, AlertCircle, MessageCircle, Send, CheckCircle2 } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../context/AuthContext'

export default function TicketDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comentario, setComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [atualizandoStatus, setAtualizandoStatus] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const templates = [
    { id: 1, titulo: 'Recebido', texto: 'Olá! Recebemos seu chamado e já estamos trabalhando na solução. Em breve retornaremos com mais informações.' },
    { id: 2, titulo: 'Em Análise', texto: 'Estamos analisando o problema reportado. Assim que tivermos mais informações, entraremos em contato.' },
    { id: 3, titulo: 'Solução Proposta', texto: 'Identificamos uma possível solução para o seu problema. Por favor, teste e nos informe se funcionou corretamente.' },
    { id: 4, titulo: 'Aguardando Retorno', texto: 'Estamos aguardando seu retorno para dar continuidade ao atendimento. Por favor, responda quando possível.' },
    { id: 5, titulo: 'Resolvido', texto: 'O problema foi resolvido com sucesso! Se precisar de mais alguma coisa, não hesite em abrir um novo chamado.' }
  ]

  useEffect(() => {
    loadTicket()
  }, [id])

  const loadTicket = async () => {
    try {
      const data = await api.tickets.getById(Number(id))
      setTicket(data)
    } catch (error) {
      console.error('Erro ao carregar ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarComentario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comentario.trim()) return

    setEnviandoComentario(true)
    try {
      await api.tickets.addComment(Number(id), {
        usuario_id: user?.id,
        comentario: comentario.trim()
      })
      setComentario('')
      loadTicket()
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
      alert('Erro ao enviar comentário')
    } finally {
      setEnviandoComentario(false)
    }
  }

  const handleAtualizarStatus = async (novoStatus: string) => {
    if (!ticket) return
    
    setAtualizandoStatus(true)
    try {
      await api.tickets.update(ticket.id, {
        status: novoStatus
      })
      loadTicket()
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      console.error('Mensagem do erro:', error?.message)
      console.error('Resposta do erro:', error?.response)
      alert('Erro ao atualizar status: ' + (error?.message || 'Erro desconhecido'))
    } finally {
      setAtualizandoStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket não encontrado</p>
      </div>
    )
  }

  const statusColors: any = {
    aberto: { bg: 'bg-blue-500', text: 'text-blue-700', bgLight: 'bg-blue-50' },
    em_andamento: { bg: 'bg-yellow-500', text: 'text-yellow-700', bgLight: 'bg-yellow-50' },
    resolvido: { bg: 'bg-green-500', text: 'text-green-700', bgLight: 'bg-green-50' },
    fechado: { bg: 'bg-gray-500', text: 'text-gray-700', bgLight: 'bg-gray-50' }
  }

  const prioridadeColors: any = {
    baixa: { bg: 'bg-blue-100', text: 'text-blue-800' },
    media: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    alta: { bg: 'bg-red-100', text: 'text-red-800' }
  }

  const statusAtual = statusColors[ticket.status] || statusColors.aberto
  const prioridadeAtual = prioridadeColors[ticket.prioridade] || prioridadeColors.media

  const calcularTempoResposta = () => {
    const criadoEm = new Date(ticket.criado_em)
    const agora = new Date()
    const diferencaHoras = Math.floor((agora.getTime() - criadoEm.getTime()) / (1000 * 60 * 60))
    
    let status = 'success'
    if (ticket.prioridade === 'alta' && diferencaHoras > 4) status = 'danger'
    else if (ticket.prioridade === 'media' && diferencaHoras > 8) status = 'warning'
    else if (diferencaHoras > 24) status = 'warning'
    
    return { tempo: formatDistanceToNow(criadoEm, { locale: ptBR, addSuffix: true }), status }
  }

  const sla = calcularTempoResposta()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tickets')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.id}</h1>
          <p className="text-gray-600">Detalhes e histórico do chamado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{ticket.titulo}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${prioridadeAtual.bg} ${prioridadeAtual.text}`}>
                    {ticket.prioridade}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusAtual.bgLight} ${statusAtual.text}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  {ticket.categoria && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      {ticket.categoria}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.descricao}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Timeline e Comentários
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{ticket.solicitante_nome || 'Sistema'}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(ticket.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">Ticket criado</p>
                  </div>
                </div>
              </div>

              {ticket.comentarios?.map((comentario: any) => (
                <div key={comentario.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{comentario.usuario_nome}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(comentario.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comentario.comentario}</p>
                    </div>
                  </div>
                </div>
              ))}

              {ticket.resolvido_em && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{ticket.atribuido_nome || 'Sistema'}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(ticket.resolvido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">Ticket resolvido</p>
                      {ticket.solucao && (
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{ticket.solucao}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleEnviarComentario} className="mt-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (comentario.trim()) {
                            handleEnviarComentario(e as any)
                          }
                        }
                      }}
                      placeholder="Adicionar um comentário... (Enter para enviar, Shift+Enter para nova linha)"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                    {user?.nivel_permissao !== 'usuario' && (
                      <button
                        type="button"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="absolute top-2 right-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        📝 Templates
                      </button>
                    )}
                  </div>
                  
                  {showTemplates && user?.nivel_permissao !== 'usuario' && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Respostas Rápidas:</p>
                      <div className="space-y-1">
                        {templates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => {
                              setComentario(template.texto)
                              setShowTemplates(false)
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-white rounded-md transition-colors"
                          >
                            <span className="font-medium text-gray-900">{template.titulo}</span>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{template.texto}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={!comentario.trim() || enviandoComentario}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {enviandoComentario ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {user?.nivel_permissao !== 'usuario' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="space-y-2">
                {ticket.status !== 'em_andamento' && (
                  <button
                    onClick={() => handleAtualizarStatus('em_andamento')}
                    disabled={atualizandoStatus}
                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                  >
                    Assumir Ticket
                  </button>
                )}
                {ticket.status !== 'resolvido' && (
                  <button
                    onClick={() => handleAtualizarStatus('resolvido')}
                    disabled={atualizandoStatus}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    Marcar como Resolvido
                  </button>
                )}
                {ticket.status === 'resolvido' && (
                  <button
                    onClick={() => handleAtualizarStatus('fechado')}
                    disabled={atualizandoStatus}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    Fechar Ticket
                  </button>
                )}
                {ticket.status === 'em_andamento' && (
                  <button
                    onClick={() => handleAtualizarStatus('aberto')}
                    disabled={atualizandoStatus}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    Retornar para Fila
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Solicitante</label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{ticket.solicitante_nome || '-'}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Atribuído a</label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{ticket.atribuido_nome || 'Não atribuído'}</span>
                </div>
              </div>

              {ticket.servico_solicitado && (
                <div>
                  <label className="text-sm text-gray-600">Serviço Solicitado</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{ticket.servico_solicitado}</span>
                  </div>
                </div>
              )}

              {ticket.setor_texto && (
                <div>
                  <label className="text-sm text-gray-600">Setor (Informado)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{ticket.setor_texto}</span>
                  </div>
                </div>
              )}

              {ticket.ramal && (
                <div>
                  <label className="text-sm text-gray-600">Ramal</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{ticket.ramal}</span>
                  </div>
                </div>
              )}

              {ticket.cdc && (
                <div>
                  <label className="text-sm text-gray-600">CDC</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{ticket.cdc}</span>
                  </div>
                </div>
              )}

              {ticket.ativo_nome && (
                <div>
                  <label className="text-sm text-gray-600">Ativo Relacionado</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{ticket.ativo_nome}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600">Criado em</label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(ticket.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Tempo de Resposta</label>
                <div className="flex items-center gap-2 mt-1">
                  <AlertCircle className={`w-4 h-4 ${
                    sla.status === 'success' ? 'text-green-500' :
                    sla.status === 'warning' ? 'text-yellow-500' :
                    'text-red-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    sla.status === 'success' ? 'text-green-700' :
                    sla.status === 'warning' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {sla.tempo}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
