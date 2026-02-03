import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

interface Filtro {
  campo: string
  label: string
  tipo: 'texto' | 'select' | 'data' | 'intervalo_data'
  opcoes?: { value: string; label: string }[]
}

interface FiltrosAvancadosProps {
  filtros: Filtro[]
  onAplicarFiltros: (valores: any) => void
  onLimparFiltros: () => void
}

export default function FiltrosAvancados({ filtros, onAplicarFiltros, onLimparFiltros }: FiltrosAvancadosProps) {
  const [aberto, setAberto] = useState(false)
  const [valores, setValores] = useState<any>({})

  const handleChange = (campo: string, valor: any) => {
    const novosValores = { ...valores, [campo]: valor }
    setValores(novosValores)
  }

  const handleAplicar = () => {
    onAplicarFiltros(valores)
    setAberto(false)
  }

  const handleLimpar = () => {
    setValores({})
    onLimparFiltros()
  }

  const contadorFiltrosAtivos = Object.values(valores).filter(v => v !== '' && v !== null && v !== undefined).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4">
        <button
          onClick={() => setAberto(!aberto)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Filtros Avançados
              {contadorFiltrosAtivos > 0 && (
                <span className="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full">
                  {contadorFiltrosAtivos} ativo{contadorFiltrosAtivos > 1 ? 's' : ''}
                </span>
              )}
            </span>
          </div>
          {aberto ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {aberto && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtros.map((filtro) => (
                <div key={filtro.campo}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {filtro.label}
                  </label>
                  
                  {filtro.tipo === 'texto' && (
                    <input
                      type="text"
                      value={valores[filtro.campo] || ''}
                      onChange={(e) => handleChange(filtro.campo, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={`Filtrar por ${filtro.label.toLowerCase()}`}
                    />
                  )}

                  {filtro.tipo === 'select' && (
                    <select
                      value={valores[filtro.campo] || ''}
                      onChange={(e) => handleChange(filtro.campo, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Todos</option>
                      {filtro.opcoes?.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {filtro.tipo === 'data' && (
                    <input
                      type="date"
                      value={valores[filtro.campo] || ''}
                      onChange={(e) => handleChange(filtro.campo, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  )}

                  {filtro.tipo === 'intervalo_data' && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={valores[`${filtro.campo}_inicio`] || ''}
                        onChange={(e) => handleChange(`${filtro.campo}_inicio`, e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="De"
                      />
                      <input
                        type="date"
                        value={valores[`${filtro.campo}_fim`] || ''}
                        onChange={(e) => handleChange(`${filtro.campo}_fim`, e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="Até"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleAplicar}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Aplicar Filtros
              </button>
              <button
                onClick={handleLimpar}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Limpar
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                {contadorFiltrosAtivos > 0 
                  ? `${contadorFiltrosAtivos} filtro${contadorFiltrosAtivos > 1 ? 's' : ''} aplicado${contadorFiltrosAtivos > 1 ? 's' : ''}`
                  : 'Nenhum filtro aplicado'
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
