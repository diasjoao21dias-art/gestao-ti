import { useState, DragEvent } from 'react'
import { User, Tag, Clock, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Ticket {
  id: number
  titulo: string
  descricao?: string
  status: string
  prioridade: string
  categoria?: string
  solicitante_nome?: string
  atribuido_nome?: string
  criado_em: string
}

interface TicketKanbanProps {
  tickets: Ticket[]
  onTicketClick: (ticket: Ticket) => void
  onStatusChange: (ticketId: number, novoStatus: string) => void
}

export default function TicketKanban({ tickets, onTicketClick, onStatusChange }: TicketKanbanProps) {
  const [draggedTicket, setDraggedTicket] = useState<number | null>(null)

  const columns = [
    { id: 'aberto', title: 'Novos', color: 'bg-blue-50 dark:bg-blue-900/20', icon: '📩' },
    { id: 'em_andamento', title: 'Em Andamento', color: 'bg-yellow-50 dark:bg-yellow-900/20', icon: '⚙️' },
    { id: 'resolvido', title: 'Resolvidos', color: 'bg-green-50 dark:bg-green-900/20', icon: '✅' },
    { id: 'fechado', title: 'Fechados', color: 'bg-gray-50 dark:bg-gray-800', icon: '📁' }
  ]

  const handleDragStart = (e: DragEvent<HTMLDivElement>, ticketId: number) => {
    setDraggedTicket(ticketId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault()
    if (draggedTicket !== null) {
      onStatusChange(draggedTicket, newStatus)
      setDraggedTicket(null)
    }
  }

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-700 dark:text-red-300', border: 'border-l-red-500' }
      case 'media': return { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-l-yellow-500' }
      case 'baixa': return { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-l-blue-500' }
      default: return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-l-gray-500' }
    }
  }

  const calcularSLA = (criadoEm: string, prioridade: string) => {
    const criado = new Date(criadoEm)
    const agora = new Date()
    const diferencaHoras = Math.floor((agora.getTime() - criado.getTime()) / (1000 * 60 * 60))
    
    let status = 'success'
    if (prioridade === 'alta' && diferencaHoras > 4) status = 'danger'
    else if (prioridade === 'media' && diferencaHoras > 8) status = 'warning'
    else if (diferencaHoras > 24) status = 'warning'
    
    return { status, horas: diferencaHoras }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className={`${column.color} rounded-lg p-4 min-h-[500px]`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 -mx-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="text-xl">{column.icon}</span>
              {column.title}
            </h3>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
              {tickets.filter(t => t.status === column.id).length}
            </span>
          </div>

          <div className="space-y-3">
            {tickets
              .filter(ticket => ticket.status === column.id)
              .map((ticket) => {
                const priorityColors = getPriorityColor(ticket.prioridade)
                const sla = calcularSLA(ticket.criado_em, ticket.prioridade)
                
                return (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                    onClick={() => onTicketClick(ticket)}
                    className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm cursor-move hover:shadow-md transition-all border-l-4 ${priorityColors.border} ${
                      draggedTicket === ticket.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">#{ticket.id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors.bg} ${priorityColors.text} font-medium`}>
                            {ticket.prioridade}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
                          {ticket.titulo}
                        </h4>
                      </div>
                    </div>

                    {ticket.descricao && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {ticket.descricao}
                      </p>
                    )}

                    <div className="space-y-2">
                      {ticket.categoria && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <Tag className="w-3.5 h-3.5" />
                          <span className="truncate">{ticket.categoria}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{ticket.solicitante_nome || 'Sem solicitante'}</span>
                      </div>

                      {ticket.atribuido_nome && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          <span className="truncate">{ticket.atribuido_nome}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDistanceToNow(new Date(ticket.criado_em), { locale: ptBR, addSuffix: true })}</span>
                        </div>
                        
                        {sla.status !== 'success' && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className={`w-3.5 h-3.5 ${
                              sla.status === 'danger' ? 'text-red-500' : 'text-yellow-500'
                            }`} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

            {tickets.filter(t => t.status === column.id).length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p>Nenhum ticket</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
