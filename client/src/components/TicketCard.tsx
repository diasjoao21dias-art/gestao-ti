import { Clock, User, Tag, AlertCircle, CheckCircle, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TicketCardProps {
  ticket: any
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  canEdit?: boolean
  canDelete?: boolean
}

export default function TicketCard({ ticket, onClick, onEdit, onDelete, canEdit, canDelete }: TicketCardProps) {
  const statusColors: any = {
    aberto: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Circle },
    em_andamento: { bg: 'bg-warning-50', text: 'text-warning-700', icon: AlertCircle },
    resolvido: { bg: 'bg-success-50', text: 'text-success-700', icon: CheckCircle },
    fechado: { bg: 'bg-gray-100', text: 'text-gray-700', icon: CheckCircle }
  }

  const prioridadeColors: any = {
    baixa: 'border-l-4 border-l-blue-400',
    media: 'border-l-4 border-l-warning-400',
    alta: 'border-l-4 border-l-danger-500',
    urgente: 'border-l-4 border-l-danger-700'
  }

  const status = statusColors[ticket.status] || statusColors.aberto
  const StatusIcon = status.icon

  return (
    <div 
      className={`card ${prioridadeColors[ticket.prioridade]} cursor-pointer animate-fade-in-up hover:scale-102 transition-transform`}
      onClick={onClick}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate mb-1">
              {ticket.titulo}
            </h3>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {ticket.status.replace('_', ' ')}
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold
              ${ticket.prioridade === 'baixa' ? 'bg-blue-100 text-blue-700' : ''}
              ${ticket.prioridade === 'media' ? 'bg-warning-100 text-warning-700' : ''}
              ${ticket.prioridade === 'alta' ? 'bg-danger-100 text-danger-700' : ''}
              ${ticket.prioridade === 'urgente' ? 'bg-danger-200 text-danger-800' : ''}
            `}>
              {ticket.prioridade}
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {ticket.descricao}
        </p>

        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
          {ticket.solicitante_nome && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span className="truncate max-w-[150px]">{ticket.solicitante_nome}</span>
            </div>
          )}
          {ticket.categoria && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              <span>{ticket.categoria}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{format(new Date(ticket.criado_em), 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>
        </div>

        {(canEdit || canDelete) && (
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.()
                }}
                className="btn btn-sm btn-outline flex-1"
              >
                Editar
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.()
                }}
                className="btn btn-sm btn-danger flex-1"
              >
                Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
