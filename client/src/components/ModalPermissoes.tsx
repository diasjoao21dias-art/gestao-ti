import { useEffect, useState } from 'react'
import { X, Check, Shield } from 'lucide-react'
import { api } from '../services/api'

interface ModalPermissoesProps {
  usuario: any
  onClose: () => void
}

const MODULOS_INFO: any = {
  ativos: { nome: 'Ativos', descricao: 'Gestão de ativos de TI' },
  tickets: { nome: 'Tickets', descricao: 'Sistema de chamados' },
  projetos: { nome: 'Projetos', descricao: 'Gestão de projetos' },
  licencas: { nome: 'Licenças', descricao: 'Controle de licenças' },
  usuarios: { nome: 'Usuários', descricao: 'Gestão de usuários' },
  conhecimento: { nome: 'Conhecimento', descricao: 'Base de conhecimento' },
  relatorios: { nome: 'Relatórios', descricao: 'Relatórios e exportações' },
  auditoria: { nome: 'Auditoria', descricao: 'Logs de auditoria' }
}

const ACOES = [
  { key: 'pode_visualizar', label: 'Visualizar', icon: '👁️' },
  { key: 'pode_criar', label: 'Criar', icon: '➕' },
  { key: 'pode_editar', label: 'Editar', icon: '✏️' },
  { key: 'pode_excluir', label: 'Excluir', icon: '🗑️' }
]

export default function ModalPermissoes({ usuario, onClose }: ModalPermissoesProps) {
  const [permissoes, setPermissoes] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [modulos, setModulos] = useState<string[]>([])

  useEffect(() => {
    carregarPermissoes()
  }, [usuario.id])

  const carregarPermissoes = async () => {
    try {
      console.log('[ModalPermissoes] Carregando permissões para usuário:', usuario.id)
      const data = await api.permissoes.getByUsuario(usuario.id)
      console.log('[ModalPermissoes] Permissões carregadas:', data)
      setModulos(data.modulos)
      setPermissoes(data.permissoes)
    } catch (error) {
      console.error('[ModalPermissoes] Erro ao carregar permissões:', error)
      alert(`Erro ao carregar permissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const togglePermissao = (modulo: string, acao: string) => {
    setPermissoes((prev: any) => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [acao]: !prev[modulo]?.[acao]
      }
    }))
  }

  const toggleTodosModulo = (modulo: string, valor: boolean) => {
    setPermissoes((prev: any) => ({
      ...prev,
      [modulo]: {
        pode_visualizar: valor,
        pode_criar: valor,
        pode_editar: valor,
        pode_excluir: valor
      }
    }))
  }

  const toggleTodasAcoes = (acao: string, valor: boolean) => {
    setPermissoes((prev: any) => {
      const novasPermissoes = { ...prev }
      modulos.forEach(modulo => {
        novasPermissoes[modulo] = {
          ...novasPermissoes[modulo],
          [acao]: valor
        }
      })
      return novasPermissoes
    })
  }

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      console.log('[ModalPermissoes] Salvando permissões para usuário:', usuario.id, permissoes)
      await api.permissoes.salvar(usuario.id, permissoes)
      console.log('[ModalPermissoes] Permissões salvas com sucesso!')
      alert('✅ Permissões salvas com sucesso!')
      onClose()
    } catch (error) {
      console.error('[ModalPermissoes] Erro ao salvar permissões:', error)
      alert(`❌ Erro ao salvar permissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p>Carregando permissões...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gerenciar Permissões</h2>
                <p className="text-gray-600">
                  {usuario.nome} ({usuario.email}) - Nível: {usuario.nivel_permissao}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {usuario.nivel_permissao === 'admin' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                ⚠️ Este usuário é <strong>Administrador</strong> e tem acesso total ao sistema, independentemente das permissões personalizadas configuradas abaixo.
              </p>
            </div>
          )}

          <div className="mb-4 flex gap-2 flex-wrap">
            <button 
              onClick={() => modulos.forEach(m => toggleTodosModulo(m, true))}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              ✓ Marcar Todas
            </button>
            <button 
              onClick={() => modulos.forEach(m => toggleTodosModulo(m, false))}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              ✗ Desmarcar Todas
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Módulo
                  </th>
                  {ACOES.map(acao => (
                    <th key={acao.key} className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">{acao.icon}</span>
                        <span className="text-xs font-medium text-gray-500 uppercase">{acao.label}</span>
                        <button
                          onClick={() => {
                            const todasMarcadas = modulos.every(m => permissoes[m]?.[acao.key])
                            toggleTodasAcoes(acao.key, !todasMarcadas)
                          }}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Todas
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {modulos.map(modulo => (
                  <tr key={modulo} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{MODULOS_INFO[modulo]?.nome || modulo}</div>
                      <div className="text-sm text-gray-500">{MODULOS_INFO[modulo]?.descricao}</div>
                    </td>
                    {ACOES.map(acao => (
                      <td key={acao.key} className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={permissoes[modulo]?.[acao.key] || false}
                          onChange={() => togglePermissao(modulo, acao.key)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-4 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => toggleTodosModulo(modulo, true)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          title="Marcar todas"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleTodosModulo(modulo, false)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Desmarcar todas"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {salvando ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Salvar Permissões
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
