import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Plus, Edit, Trash2, Search, AlertTriangle, X } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'

interface FormData {
  software: string
  tipo_licenca: string
  quantidade_total: string
  quantidade_usada: string
  chave_licenca: string
  fornecedor: string
  data_aquisicao: string
  data_expiracao: string
  valor: string
  responsavel_id: string
  status: string
  observacoes: string
}

export default function Licencas() {
  const [licencas, setLicencas] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
    software: '',
    tipo_licenca: '',
    quantidade_total: '',
    quantidade_usada: '0',
    chave_licenca: '',
    fornecedor: '',
    data_aquisicao: '',
    data_expiracao: '',
    valor: '',
    responsavel_id: '',
    status: 'ativa',
    observacoes: ''
  })

  useEffect(() => {
    loadLicencas()
    loadUsuarios()
  }, [])

  const loadLicencas = async () => {
    try {
      const data = await api.licencas.getAll()
      setLicencas(data)
    } catch (error) {
      console.error('Erro ao carregar licenças:', error)
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
    if (confirm('Deseja realmente excluir esta licença?')) {
      try {
        await api.licencas.delete(id)
        loadLicencas()
      } catch (error) {
        console.error('Erro ao excluir licença:', error)
        alert('Erro ao excluir licença')
      }
    }
  }

  const handleOpenModal = (licenca?: any) => {
    if (licenca) {
      setEditingId(licenca.id)
      setFormData({
        software: licenca.software || '',
        tipo_licenca: licenca.tipo_licenca || '',
        quantidade_total: licenca.quantidade_total?.toString() || '',
        quantidade_usada: licenca.quantidade_usada?.toString() || '0',
        chave_licenca: licenca.chave_licenca || '',
        fornecedor: licenca.fornecedor || '',
        data_aquisicao: licenca.data_aquisicao || '',
        data_expiracao: licenca.data_expiracao || '',
        valor: licenca.valor || '',
        responsavel_id: licenca.responsavel_id || '',
        status: licenca.status || 'ativa',
        observacoes: licenca.observacoes || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        software: '',
        tipo_licenca: '',
        quantidade_total: '',
        quantidade_usada: '0',
        chave_licenca: '',
        fornecedor: '',
        data_aquisicao: '',
        data_expiracao: '',
        valor: '',
        responsavel_id: '',
        status: 'ativa',
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
        quantidade_total: formData.quantidade_total ? parseInt(formData.quantidade_total) : null,
        quantidade_usada: formData.quantidade_usada ? parseInt(formData.quantidade_usada) : 0,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        responsavel_id: formData.responsavel_id ? parseInt(formData.responsavel_id) : null
      }

      if (editingId) {
        await api.licencas.update(editingId, dataToSend)
      } else {
        await api.licencas.create(dataToSend)
      }
      
      handleCloseModal()
      loadLicencas()
    } catch (error) {
      console.error('Erro ao salvar licença:', error)
      alert('Erro ao salvar licença')
    }
  }

  const getDaysUntilExpiration = (dataExpiracao: string) => {
    if (!dataExpiracao) return null
    return differenceInDays(parseISO(dataExpiracao), new Date())
  }

  const filteredLicencas = licencas.filter(licenca =>
    licenca.software.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12 dark:text-gray-100">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Controle de Licenças</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestão de licenças de software</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Nova Licença
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar licenças..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Software</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fornecedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiração</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLicencas.map((licenca) => {
              const daysUntilExpiration = getDaysUntilExpiration(licenca.data_expiracao)
              const isExpiring = daysUntilExpiration !== null && daysUntilExpiration <= 30 && daysUntilExpiration >= 0
              const isExpired = daysUntilExpiration !== null && daysUntilExpiration < 0

              return (
                <tr key={licenca.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {licenca.software}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{licenca.tipo_licenca}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {licenca.quantidade_usada || 0} / {licenca.quantidade_total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{licenca.fornecedor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      {licenca.data_expiracao && format(parseISO(licenca.data_expiracao), 'dd/MM/yyyy')}
                      {isExpiring && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      {isExpired && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      licenca.status === 'ativa' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      licenca.status === 'expirada' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {licenca.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleOpenModal(licenca)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(licenca.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editingId ? 'Editar Licença' : 'Nova Licença'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Software *</label>
                  <input
                    type="text"
                    required
                    value={formData.software}
                    onChange={(e) => setFormData({ ...formData, software: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Licença</label>
                    <input
                      type="text"
                      value={formData.tipo_licenca}
                      onChange={(e) => setFormData({ ...formData, tipo_licenca: e.target.value })}
                      placeholder="Ex: Perpétua, Anual, Subscription"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="ativa">Ativa</option>
                      <option value="expirada">Expirada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade Total</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantidade_total}
                      onChange={(e) => setFormData({ ...formData, quantidade_total: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade Usada</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantidade_usada}
                      onChange={(e) => setFormData({ ...formData, quantidade_usada: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chave de Licença</label>
                  <input
                    type="text"
                    value={formData.chave_licenca}
                    onChange={(e) => setFormData({ ...formData, chave_licenca: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fornecedor</label>
                  <input
                    type="text"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Aquisição</label>
                    <input
                      type="date"
                      value={formData.data_aquisicao}
                      onChange={(e) => setFormData({ ...formData, data_aquisicao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Expiração</label>
                    <input
                      type="date"
                      value={formData.data_expiracao}
                      onChange={(e) => setFormData({ ...formData, data_expiracao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
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
