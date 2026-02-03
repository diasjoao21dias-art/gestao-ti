const API_BASE_URL = '/api'

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('token')
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    if (response.status === 403) {
      try {
        const errorData = await response.json()
        if (errorData.error === 'LICENSE_EXPIRED') {
          window.location.href = '/licenca-expirada'
          throw new Error('LICENSE_EXPIRED')
        }
      } catch (e) {
        if (e instanceof Error && e.message === 'LICENSE_EXPIRED') {
          throw e
        }
      }
    }
    
    try {
      const errorData = await response.json()
      throw new Error(errorData.error || `API Error: ${response.statusText}`)
    } catch (e) {
      if (e instanceof Error && e.message !== `API Error: ${response.statusText}`) {
        throw e
      }
      throw new Error(`API Error: ${response.statusText}`)
    }
  }

  return response.json()
}

export const api = {
  dashboard: {
    getStats: () => fetchAPI('/dashboard/stats'),
  },
  usuarios: {
    getAll: () => fetchAPI('/usuarios'),
    getById: (id: number) => fetchAPI(`/usuarios/${id}`),
    create: (data: any) => fetchAPI('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchAPI(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI(`/usuarios/${id}`, { method: 'DELETE' }),
  },
  ativos: {
    getAll: (filters?: any) => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value))
        })
      }
      return fetchAPI(`/ativos${params.toString() ? '?' + params.toString() : ''}`)
    },
    getDisponiveis: () => fetchAPI('/ativos/disponiveis'),
    getById: (id: number) => fetchAPI(`/ativos/${id}`),
    create: (data: any) => fetchAPI('/ativos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchAPI(`/ativos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI(`/ativos/${id}`, { method: 'DELETE' }),
    getComponentes: (id: number) => fetchAPI(`/ativos/${id}/componentes`),
    addComponente: (id: number, data: any) => fetchAPI(`/ativos/${id}/componentes`, { method: 'POST', body: JSON.stringify(data) }),
    updateComponente: (id: number, data: any) => fetchAPI(`/ativos/componentes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteComponente: (id: number) => fetchAPI(`/ativos/componentes/${id}`, { method: 'DELETE' }),
    getHistorico: (id: number) => fetchAPI(`/ativos/${id}/historico`),
  },
  inventario: {
    getCategorias: () => fetchAPI('/inventario/categorias'),
    createCategoria: (data: any) => fetchAPI('/inventario/categorias', { method: 'POST', body: JSON.stringify(data) }),
    getLocalizacoes: () => fetchAPI('/inventario/localizacoes'),
    getLocalizacoesArvore: () => fetchAPI('/inventario/localizacoes/arvore'),
    createLocalizacao: (data: any) => fetchAPI('/inventario/localizacoes', { method: 'POST', body: JSON.stringify(data) }),
    updateLocalizacao: (id: number, data: any) => fetchAPI(`/inventario/localizacoes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLocalizacao: (id: number) => fetchAPI(`/inventario/localizacoes/${id}`, { method: 'DELETE' }),
    getFornecedores: () => fetchAPI('/inventario/fornecedores'),
    createFornecedor: (data: any) => fetchAPI('/inventario/fornecedores', { method: 'POST', body: JSON.stringify(data) }),
    updateFornecedor: (id: number, data: any) => fetchAPI(`/inventario/fornecedores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getEstoque: () => fetchAPI('/inventario/estoque'),
    createItemEstoque: (data: any) => fetchAPI('/inventario/estoque', { method: 'POST', body: JSON.stringify(data) }),
    updateItemEstoque: (id: number, data: any) => fetchAPI(`/inventario/estoque/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    movimentarEstoque: (id: number, data: any) => fetchAPI(`/inventario/estoque/${id}/movimentacao`, { method: 'POST', body: JSON.stringify(data) }),
    deleteItemEstoque: (id: number) => fetchAPI(`/inventario/estoque/${id}`, { method: 'DELETE' }),
    getMovimentacoes: (id: number) => fetchAPI(`/inventario/estoque/${id}/movimentacoes`),
    getDashboard: () => fetchAPI('/inventario/dashboard'),
  },
  termos: {
    getAll: () => fetchAPI('/termos'),
    getById: (id: number) => fetchAPI(`/termos/${id}`),
    create: (data: any) => fetchAPI('/termos', { method: 'POST', body: JSON.stringify(data) }),
    assinar: (id: number, data: any) => fetchAPI(`/termos/${id}/assinar`, { method: 'POST', body: JSON.stringify(data) }),
    devolver: (id: number, data: any) => fetchAPI(`/termos/${id}/devolver`, { method: 'POST', body: JSON.stringify(data) }),
    getByUsuario: (id: number) => fetchAPI(`/termos/usuario/${id}`),
    getHistoricoAtivo: (id: number) => fetchAPI(`/termos/ativo/${id}/historico`),
  },
  rede: {
    getVlans: () => fetchAPI('/rede/vlans'),
    createVlan: (data: any) => fetchAPI('/rede/vlans', { method: 'POST', body: JSON.stringify(data) }),
    updateVlan: (id: number, data: any) => fetchAPI(`/rede/vlans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteVlan: (id: number) => fetchAPI(`/rede/vlans/${id}`, { method: 'DELETE' }),
    getSubnets: () => fetchAPI('/rede/subnets'),
    createSubnet: (data: any) => fetchAPI('/rede/subnets', { method: 'POST', body: JSON.stringify(data) }),
    updateSubnet: (id: number, data: any) => fetchAPI(`/rede/subnets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSubnet: (id: number) => fetchAPI(`/rede/subnets/${id}`, { method: 'DELETE' }),
    getIps: () => fetchAPI('/rede/ips'),
    createIp: (data: any) => fetchAPI('/rede/ips', { method: 'POST', body: JSON.stringify(data) }),
    updateIp: (id: number, data: any) => fetchAPI(`/rede/ips/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteIp: (id: number) => fetchAPI(`/rede/ips/${id}`, { method: 'DELETE' }),
    getPortasSwitch: (id: number) => fetchAPI(`/rede/switches/${id}/portas`),
    createPorta: (id: number, data: any) => fetchAPI(`/rede/switches/${id}/portas`, { method: 'POST', body: JSON.stringify(data) }),
    updatePorta: (id: number, data: any) => fetchAPI(`/rede/portas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getDashboard: () => fetchAPI('/rede/dashboard'),
    getRoteadores: () => fetchAPI('/rede/roteadores'),
    createRoteador: (data: any) => fetchAPI('/rede/roteadores', { method: 'POST', body: JSON.stringify(data) }),
    updateRoteador: (id: number, data: any) => fetchAPI(`/rede/roteadores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRoteador: (id: number) => fetchAPI(`/rede/roteadores/${id}`, { method: 'DELETE' }),
  },
  tickets: {
    getAll: () => fetchAPI('/tickets'),
    getById: (id: number) => fetchAPI(`/tickets/${id}`),
    create: (data: any) => fetchAPI('/tickets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchAPI(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI(`/tickets/${id}`, { method: 'DELETE' }),
    addComment: (id: number, data: any) => fetchAPI(`/tickets/${id}/comentarios`, { method: 'POST', body: JSON.stringify(data) }),
  },
  projetos: {
    getAll: () => fetchAPI('/projetos'),
    getById: (id: number) => fetchAPI(`/projetos/${id}`),
    create: (data: any) => fetchAPI('/projetos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchAPI(`/projetos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI(`/projetos/${id}`, { method: 'DELETE' }),
    addTarefa: (id: number, data: any) => fetchAPI(`/projetos/${id}/tarefas`, { method: 'POST', body: JSON.stringify(data) }),
    updateTarefa: (id: number, data: any) => fetchAPI(`/projetos/tarefas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTarefa: (id: number) => fetchAPI(`/projetos/tarefas/${id}`, { method: 'DELETE' }),
  },
  licencas: {
    getAll: () => fetchAPI('/licencas'),
    getById: (id: number) => fetchAPI(`/licencas/${id}`),
    create: (data: any) => fetchAPI('/licencas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchAPI(`/licencas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI(`/licencas/${id}`, { method: 'DELETE' }),
  },
  conhecimento: {
    getAll: () => fetchAPI('/conhecimento'),
    getById: (id: number) => fetchAPI(`/conhecimento/${id}`),
    create: (data: any) => fetchAPI('/conhecimento', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchAPI(`/conhecimento/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI(`/conhecimento/${id}`, { method: 'DELETE' }),
    markUtil: (id: number) => fetchAPI(`/conhecimento/${id}/util`, { method: 'POST' }),
    getAnexos: (id: number) => fetchAPI(`/conhecimento/${id}/anexos`),
    uploadAnexos: async (id: number, files: FileList) => {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('arquivos', files[i]);
      }
      const response = await fetch(`/api/conhecimento/${id}/anexos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }
      return response.json();
    },
    deleteAnexo: (anexoId: number) => fetchAPI(`/conhecimento/anexos/${anexoId}`, { method: 'DELETE' }),
    getAnexoUrl: (anexoId: number) => `/api/conhecimento/anexos/${anexoId}/download`,
  },
  permissoes: {
    getByUsuario: (usuarioId: number) => fetchAPI(`/permissoes/${usuarioId}`),
    salvar: (usuarioId: number, permissoes: any) => fetchAPI(`/permissoes/${usuarioId}`, { method: 'POST', body: JSON.stringify({ permissoes }) }),
    verificar: (usuarioId: number, modulo: string, acao: string) => fetchAPI('/permissoes/verificar', { method: 'POST', body: JSON.stringify({ usuarioId, modulo, acao }) }),
  },
  maquinas: {
    getAll: () => fetchAPI('/maquinas'),
    getById: (id: number) => fetchAPI(`/maquinas/${id}`),
    create: (data: any) => fetchAPI('/maquinas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => fetchAPI(`/maquinas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI(`/maquinas/${id}`, { method: 'DELETE' }),
    getComponentes: (id: number) => fetchAPI(`/maquinas/${id}/componentes`),
    addComponente: (id: number, data: any) => fetchAPI(`/maquinas/${id}/componentes`, { method: 'POST', body: JSON.stringify(data) }),
    updateComponente: (id: number, data: any) => fetchAPI(`/maquinas/componentes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteComponente: (id: number) => fetchAPI(`/maquinas/componentes/${id}`, { method: 'DELETE' }),
  },
  get: (endpoint: string) => fetchAPI(endpoint),
  post: (endpoint: string, data: any) => fetchAPI(endpoint, { method: 'POST', body: JSON.stringify(data) }),
}
