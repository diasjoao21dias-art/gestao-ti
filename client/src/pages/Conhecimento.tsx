import { useEffect, useState, useRef } from 'react'
import { api } from '../services/api'
import { Plus, Edit, Trash2, Search, BookOpen, ThumbsUp, Eye, X, Upload, FileText, Image, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface FormData {
  titulo: string
  conteudo: string
  categoria: string
  tags: string
  publicado: boolean
}

interface Anexo {
  id: number
  nome_original: string
  mime_type: string
  tamanho: number
  criado_em: string
}

export default function Conhecimento() {
  const { user } = useAuth()
  const [artigos, setArtigos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingArtigo, setViewingArtigo] = useState<any>(null)
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    conteudo: '',
    categoria: '',
    tags: '',
    publicado: true
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadArtigos()
  }, [])

  const loadArtigos = async () => {
    try {
      const data = await api.conhecimento.getAll()
      setArtigos(data)
    } catch (error) {
      console.error('Erro ao carregar artigos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnexos = async (artigoId: number) => {
    try {
      const data = await api.conhecimento.getAnexos(artigoId)
      setAnexos(data)
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
      setAnexos([])
    }
  }

  const canEditOrDelete = (artigo: any) => {
    if (!user) return false
    return user.nivel_permissao === 'admin' || user.id === artigo.autor_id
  }

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir este artigo?')) {
      try {
        await api.conhecimento.delete(id)
        loadArtigos()
      } catch (error) {
        console.error('Erro ao excluir artigo:', error)
        alert('Erro ao excluir artigo')
      }
    }
  }

  const handleOpenModal = (artigo?: any) => {
    if (artigo) {
      setEditingId(artigo.id)
      setFormData({
        titulo: artigo.titulo || '',
        conteudo: artigo.conteudo || '',
        categoria: artigo.categoria || '',
        tags: artigo.tags ? artigo.tags.join(', ') : '',
        publicado: artigo.publicado !== undefined ? artigo.publicado : true
      })
      loadAnexos(artigo.id)
    } else {
      setEditingId(null)
      setAnexos([])
      setFormData({
        titulo: '',
        conteudo: '',
        categoria: '',
        tags: '',
        publicado: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setAnexos([])
  }

  const handleViewArtigo = async (artigo: any) => {
    setViewingArtigo(artigo)
    await loadAnexos(artigo.id)
    setShowViewModal(true)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setViewingArtigo(null)
    setAnexos([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const dataToSend: any = {
        titulo: formData.titulo,
        conteudo: formData.conteudo,
        categoria: formData.categoria,
        tags: tagsArray,
        publicado: formData.publicado
      }

      if (editingId) {
        await api.conhecimento.update(editingId, dataToSend)
      } else {
        dataToSend.autor_id = user?.id
        const newArtigo = await api.conhecimento.create(dataToSend)
        setEditingId(newArtigo.id)
      }
      
      handleCloseModal()
      loadArtigos()
    } catch (error) {
      console.error('Erro ao salvar artigo:', error)
      alert('Erro ao salvar artigo')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingId) return

    setUploadingFiles(true)
    try {
      await api.conhecimento.uploadAnexos(editingId, e.target.files)
      await loadAnexos(editingId)
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      alert(error.message || 'Erro ao fazer upload de arquivos')
    } finally {
      setUploadingFiles(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteAnexo = async (anexoId: number) => {
    if (!confirm('Deseja excluir este anexo?')) return

    try {
      await api.conhecimento.deleteAnexo(anexoId)
      setAnexos(anexos.filter(a => a.id !== anexoId))
    } catch (error) {
      console.error('Erro ao excluir anexo:', error)
      alert('Erro ao excluir anexo')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-green-500" />
    }
    return <FileText className="w-5 h-5 text-red-500" />
  }

  const filteredArtigos = artigos.filter(artigo =>
    artigo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artigo.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12 dark:text-gray-100">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Base de Conhecimento</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Artigos e documentação técnica</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Novo Artigo
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar artigos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArtigos.map((artigo) => (
          <div key={artigo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase">
                  {artigo.categoria || 'Geral'}
                </span>
              </div>
              {canEditOrDelete(artigo) && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(artigo)}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(artigo.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div 
              className="cursor-pointer" 
              onClick={() => handleViewArtigo(artigo)}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-primary-600 dark:hover:text-primary-400">{artigo.titulo}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                {artigo.conteudo?.substring(0, 150)}...
              </p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{artigo.visualizacoes || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{artigo.util || 0}</span>
                </div>
              </div>
              <span className="text-xs">{artigo.autor_nome}</span>
            </div>

            {artigo.tags && artigo.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {artigo.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editingId ? 'Editar Artigo' : 'Novo Artigo'}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conteúdo *</label>
                  <textarea
                    required
                    value={formData.conteudo}
                    onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                    <input
                      type="text"
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      placeholder="Ex: Tutoriais, FAQ, Procedimentos"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
                    <select
                      required
                      value={formData.publicado ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, publicado: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="true">Publicado</option>
                      <option value="false">Rascunho</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Ex: VPN, Rede, Segurança"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {editingId && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Anexos (PDF, PNG, JPEG)
                    </label>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className={`flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingFiles ? 'Enviando...' : 'Adicionar Arquivos'}
                      </label>
                      <span className="text-xs text-gray-500">Máximo 10MB por arquivo</span>
                    </div>

                    {anexos.length > 0 && (
                      <div className="space-y-2">
                        {anexos.map(anexo => (
                          <div key={anexo.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-2">
                              {getFileIcon(anexo.mime_type)}
                              <span className="text-sm text-gray-700 dark:text-gray-300">{anexo.nome_original}</span>
                              <span className="text-xs text-gray-500">({formatFileSize(anexo.tamanho)})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteAnexo(anexo.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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

      {showViewModal && viewingArtigo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase">
                    {viewingArtigo.categoria || 'Geral'}
                  </span>
                </div>
                <button onClick={handleCloseViewModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {viewingArtigo.titulo}
              </h2>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{viewingArtigo.visualizacoes || 0} visualizações</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{viewingArtigo.util || 0} útil</span>
                </div>
                <span>Por: {viewingArtigo.autor_nome || 'Desconhecido'}</span>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {viewingArtigo.conteudo}
                </div>
              </div>

              {anexos.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Anexos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {anexos.map(anexo => (
                      <a
                        key={anexo.id}
                        href={api.conhecimento.getAnexoUrl(anexo.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        {anexo.mime_type.startsWith('image/') ? (
                          <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={api.conhecimento.getAnexoUrl(anexo.id)} 
                              alt={anexo.nome_original}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-red-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{anexo.nome_original}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(anexo.tamanho)}</p>
                        </div>
                        <Download className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {viewingArtigo.tags && viewingArtigo.tags.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {viewingArtigo.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseViewModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Fechar
                </button>
                {canEditOrDelete(viewingArtigo) && (
                  <button
                    onClick={() => {
                      handleCloseViewModal()
                      handleOpenModal(viewingArtigo)
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
