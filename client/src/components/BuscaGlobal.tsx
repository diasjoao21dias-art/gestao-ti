import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader, HardDrive, Ticket, FolderKanban, Key, BookOpen, Users } from 'lucide-react'
import { api } from '../services/api'

interface BuscaGlobalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BuscaGlobal({ isOpen, onClose }: BuscaGlobalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setResults(null)
    }
  }, [isOpen])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.length >= 2) {
        performSearch()
      } else {
        setResults(null)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  const performSearch = async () => {
    setLoading(true)
    try {
      const [ativos, tickets, projetos, licencas, artigos, usuarios] = await Promise.all([
        api.ativos.getAll().then(data => data.filter((item: any) => 
          item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5)),
        api.tickets.getAll().then(data => data.filter((item: any) => 
          item.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5)),
        api.projetos.getAll().then(data => data.filter((item: any) => 
          item.nome?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5)),
        api.licencas.getAll().then(data => data.filter((item: any) => 
          item.software?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5)),
        api.conhecimento.getAll().then(data => data.filter((item: any) => 
          item.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5)),
        api.usuarios.getAll().then(data => data.filter((item: any) => 
          item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.email?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5)),
      ])

      setResults({ ativos, tickets, projetos, licencas, artigos, usuarios })
    } catch (error) {
      console.error('Erro ao buscar:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (type: string) => {
    const routes: any = {
      ativos: '/ativos',
      tickets: '/tickets',
      projetos: '/projetos',
      licencas: '/licencas',
      artigos: '/conhecimento',
      usuarios: '/usuarios',
    }
    navigate(routes[type])
    onClose()
  }

  const getResultIcon = (type: string) => {
    const icons: any = {
      ativos: HardDrive,
      tickets: Ticket,
      projetos: FolderKanban,
      licencas: Key,
      artigos: BookOpen,
      usuarios: Users,
    }
    return icons[type] || Search
  }

  const getResultLabel = (type: string) => {
    const labels: any = {
      ativos: 'Ativos',
      tickets: 'Tickets',
      projetos: 'Projetos',
      licencas: 'Licenças',
      artigos: 'Base de Conhecimento',
      usuarios: 'Usuários',
    }
    return labels[type] || type
  }

  if (!isOpen) return null

  const totalResults = results ? Object.values(results).flat().length : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-32">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[600px] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar em tudo... (Ativos, Tickets, Projetos, etc.)"
              className="flex-1 outline-none text-lg bg-transparent dark:text-gray-100"
              autoFocus
            />
            {loading && <Loader className="w-5 h-5 text-gray-400 animate-spin" />}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {searchTerm.length < 2 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}

          {searchTerm.length >= 2 && !loading && totalResults === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Nenhum resultado encontrado para "{searchTerm}"
            </div>
          )}

          {results && totalResults > 0 && (
            <div className="space-y-6">
              {Object.entries(results).map(([type, items]: [string, any]) => {
                if (items.length === 0) return null
                const Icon = getResultIcon(type)
                
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        {getResultLabel(type)} ({items.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {items.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => handleResultClick(type)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {item.nome || item.titulo || item.software || item.email}
                          </div>
                          {item.descricao && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                              {item.descricao}
                            </div>
                          )}
                          {item.numero_serie && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              S/N: {item.numero_serie}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd> Navegar</span>
            <span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> Selecionar</span>
            <span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> Fechar</span>
          </div>
          {totalResults > 0 && (
            <div>{totalResults} resultado{totalResults > 1 ? 's' : ''}</div>
          )}
        </div>
      </div>
    </div>
  )
}
