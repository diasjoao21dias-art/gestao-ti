import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import { usePermissions } from '../hooks/usePermissions'
import AssetSearch from '../components/AssetSearch'
import ExportButton from '../components/ExportButton'
import { format } from 'date-fns'

interface FormData {
  tipo: string
  nome: string
  marca: string
  modelo: string
  numero_serie: string
  data_aquisicao: string
  valor_aquisicao: string
  localizacao: string
  responsavel_id: string
  status: string
  observacoes: string
}

export default function Ativos() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [ativos, setAtivos] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState<any>({ searchTerm: '', tipo: '', status: '', localizacao: '' })
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
    tipo: 'hardware',
    nome: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    data_aquisicao: '',
    valor_aquisicao: '',
    localizacao: '',
    responsavel_id: '',
    status: 'disponivel',
    observacoes: ''
  })

  useEffect(() => {
    loadAtivos()
    loadUsuarios()
  }, [])

  const loadAtivos = async () => {
    try {
      const data = await api.ativos.getAll()
      setAtivos(data)
    } catch (error) {
      console.error('Erro ao carregar ativos:', error)
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

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir este ativo?')) {
      try {
        await api.ativos.delete(id)
        loadAtivos()
      } catch (error) {
        console.error('Erro ao excluir ativo:', error)
        alert('Erro ao excluir ativo')
      }
    }
  }

  const handleOpenModal = (ativo?: any) => {
    if (ativo) {
      setEditingId(ativo.id)
      setFormData({
        tipo: ativo.tipo || 'hardware',
        nome: ativo.nome || '',
        marca: ativo.marca || '',
        modelo: ativo.modelo || '',
        numero_serie: ativo.numero_serie || '',
        data_aquisicao: ativo.data_aquisicao || '',
        valor_aquisicao: ativo.valor_aquisicao || '',
        localizacao: ativo.localizacao || '',
        responsavel_id: ativo.responsavel_id || '',
        status: ativo.status || 'disponivel',
        observacoes: ativo.observacoes || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        tipo: 'hardware',
        nome: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        data_aquisicao: '',
        valor_aquisicao: '',
        localizacao: '',
        responsavel_id: '',
        status: 'disponivel',
        observacoes: ''
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
        responsavel_id: formData.responsavel_id ? parseInt(formData.responsavel_id) : null,
        valor_aquisicao: formData.valor_aquisicao ? parseFloat(formData.valor_aquisicao) : null
      }

      if (editingId) {
        await api.ativos.update(editingId, dataToSend)
      } else {
        await api.ativos.create(dataToSend)
      }
      
      handleCloseModal()
      loadAtivos()
    } catch (error) {
      console.error('Erro ao salvar ativo:', error)
      alert('Erro ao salvar ativo')
    }
  }

  const handleSearch = (filters: any) => {
    setSearchFilters(filters)
  }

  const filteredAtivos = ativos.filter(ativo => {
    if (searchFilters.searchTerm && !ativo.nome.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) &&
        !ativo.modelo?.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) &&
        !ativo.numero_serie?.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())) {
      return false
    }
    if (searchFilters.tipo && ativo.tipo !== searchFilters.tipo) return false
    if (searchFilters.status && ativo.status !== searchFilters.status) return false
    if (searchFilters.localizacao && !ativo.localizacao?.toLowerCase().includes(searchFilters.localizacao.toLowerCase())) return false
    return true
  })

  if (loading) {
    return <div className="text-center py-12 dark:text-gray-100">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestão de Ativos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Controle de hardware, software e equipamentos</p>
        </div>
        {canCreate('ativos') && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Novo Ativo
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <AssetSearch
            onSearch={handleSearch}
            onExport={undefined}
            onGenerateQR={undefined}
          />
        </div>
        <ExportButton
          data={filteredAtivos.map(ativo => ({
            Tipo: ativo.tipo,
            Nome: ativo.nome,
            Marca: ativo.marca,
            Modelo: ativo.modelo,
            'Número Série': ativo.numero_serie,
            Localização: ativo.localizacao,
            Responsável: ativo.responsavel_nome || '-',
            Status: ativo.status,
            'Data Aquisição': ativo.data_aquisicao ? format(new Date(ativo.data_aquisicao), 'dd/MM/yyyy') : '-'
          }))}
          filename="ativos"
          title="Relatório de Ativos"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marca/Modelo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Número Série</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Responsável</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAtivos.map((ativo) => (
              <tr key={ativo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{ativo.tipo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{ativo.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ativo.marca} {ativo.modelo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ativo.numero_serie}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ativo.responsavel_nome || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    ativo.status === 'disponivel' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    ativo.status === 'em_uso' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                    ativo.status === 'manutencao' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                    'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {ativo.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit('ativos') && (
                    <button 
                      onClick={() => handleOpenModal(ativo)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete('ativos') && (
                    <button
                      onClick={() => handleDelete(ativo.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editingId ? 'Editar Ativo' : 'Novo Ativo'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo *</label>
                    <select
                      required
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="rede">Rede</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="disponivel">Disponível</option>
                      <option value="em_uso">Em Uso</option>
                      <option value="manutencao">Manutenção</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca</label>
                    <input
                      type="text"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modelo</label>
                    <input
                      type="text"
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Série</label>
                    <input
                      type="text"
                      value={formData.numero_serie}
                      onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Aquisição</label>
                    <input
                      type="date"
                      value={formData.data_aquisicao}
                      onChange={(e) => setFormData({ ...formData, data_aquisicao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor de Aquisição</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor_aquisicao}
                      onChange={(e) => setFormData({ ...formData, valor_aquisicao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Localização</label>
                    <input
                      type="text"
                      value={formData.localizacao}
                      onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsável</label>
                  <select
                    value={formData.responsavel_id}
                    onChange={(e) => setFormData({ ...formData, responsavel_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Selecione um responsável</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
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
