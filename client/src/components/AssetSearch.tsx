import { useState } from 'react'
import { Search, Filter, X, Download, QrCode } from 'lucide-react'

interface AssetSearchProps {
  onSearch: (filters: any) => void
  onExport?: () => void
  onGenerateQR?: () => void
}

export default function AssetSearch({ onSearch, onExport, onGenerateQR }: AssetSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    tipo: '',
    status: '',
    localizacao: ''
  })

  const handleSearch = () => {
    onSearch({ searchTerm, ...filters })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setFilters({ tipo: '', status: '', localizacao: '' })
    onSearch({ searchTerm: '', tipo: '', status: '', localizacao: '' })
  }

  const activeFiltersCount = Object.values(filters).filter(v => v).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por nome, modelo, número de série..."
            className="input pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${activeFiltersCount > 0 ? 'btn-primary' : 'btn-outline'} relative`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {onExport && (
            <button onClick={onExport} className="btn btn-outline">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}

          {onGenerateQR && (
            <button onClick={onGenerateQR} className="btn btn-secondary">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QR Code</span>
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="card animate-fade-in-up">
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tipo
                </label>
                <select
                  value={filters.tipo}
                  onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                  className="input"
                >
                  <option value="">Todos</option>
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="rede">Rede</option>
                  <option value="periférico">Periférico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input"
                >
                  <option value="">Todos</option>
                  <option value="disponivel">Disponível</option>
                  <option value="em_uso">Em Uso</option>
                  <option value="manutencao">Manutenção</option>
                  <option value="desativado">Desativado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Localização
                </label>
                <input
                  type="text"
                  value={filters.localizacao}
                  onChange={(e) => setFilters({ ...filters, localizacao: e.target.value })}
                  placeholder="Ex: Sala 101"
                  className="input"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={handleClearFilters} className="btn btn-outline">
                Limpar
              </button>
              <button onClick={handleSearch} className="btn btn-primary">
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
