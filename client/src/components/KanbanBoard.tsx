import { useState, DragEvent } from 'react'
import { X, Plus, User, Calendar, Flag, Trash2 } from 'lucide-react'

interface Tarefa {
  id: number
  titulo: string
  descricao?: string
  status: string
  prioridade: string
  responsavel_nome?: string
  data_prevista?: string
}

interface KanbanBoardProps {
  tarefas: Tarefa[]
  onClose: () => void
  onUpdateTarefa: (tarefaId: number, newStatus: string) => void
  onAddTarefa: (status: string) => void
  onDeleteTarefa: (tarefaId: number) => void
}

export default function KanbanBoard({ tarefas, onClose, onUpdateTarefa, onAddTarefa, onDeleteTarefa }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<number | null>(null)

  const columns = [
    { id: 'pendente', title: 'A Fazer', color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'em_andamento', title: 'Em Andamento', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'concluido', title: 'Concluído', color: 'bg-green-50 dark:bg-green-900/20' }
  ]

  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: number) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault()
    if (draggedTask !== null) {
      onUpdateTarefa(draggedTask, newStatus)
      setDraggedTask(null)
    }
  }

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'text-red-600 dark:text-red-400'
      case 'media': return 'text-yellow-600 dark:text-yellow-400'
      case 'baixa': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-7xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kanban Board - Tarefas</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-3 gap-4 h-full">
            {columns.map((column) => (
              <div
                key={column.id}
                className={`${column.color} rounded-lg p-4 flex flex-col`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {column.title}
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({tarefas.filter(t => t.status === column.id).length})
                    </span>
                  </h3>
                  <button
                    onClick={() => onAddTarefa(column.id)}
                    className="p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded transition-colors"
                    title="Adicionar tarefa"
                  >
                    <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {tarefas
                    .filter(tarefa => tarefa.status === column.id)
                    .map((tarefa) => (
                      <div
                        key={tarefa.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tarefa.id)}
                        className={`bg-white dark:bg-gray-700 p-4 rounded-lg shadow cursor-move hover:shadow-md transition-all ${
                          draggedTask === tarefa.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm flex-1 pr-2">
                            {tarefa.titulo}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Flag className={`w-4 h-4 ${getPriorityColor(tarefa.prioridade)}`} />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Deseja realmente excluir esta tarefa?')) {
                                  onDeleteTarefa(tarefa.id)
                                }
                              }}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors opacity-70 hover:opacity-100"
                              title="Excluir tarefa"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>

                        {tarefa.descricao && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {tarefa.descricao}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          {tarefa.responsavel_nome && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{tarefa.responsavel_nome}</span>
                            </div>
                          )}
                          {tarefa.data_prevista && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(tarefa.data_prevista).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {tarefas.filter(t => t.status === column.id).length === 0 && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                      Nenhuma tarefa
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          💡 Dica: Arraste e solte as tarefas entre as colunas para atualizar o status
        </div>
      </div>
    </div>
  )
}
