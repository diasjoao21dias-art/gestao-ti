import { useState, useEffect } from 'react';
import { Shield, Search, Calendar, User, Activity } from 'lucide-react';

interface LogAuditoria {
  id: number;
  usuario_nome: string;
  acao: string;
  modulo: string;
  registro_id: number;
  detalhes: any;
  ip_address: string;
  criado_em: string;
}

export default function Auditoria() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [filtros, setFiltros] = useState({
    usuario_id: '',
    modulo: '',
    acao: '',
    data_inicio: '',
    data_fim: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarLogs();
  }, []);

  const carregarLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/auditoria?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar logs de auditoria');
      }
      
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getAcaoColor = (acao: string) => {
    switch (acao.toLowerCase()) {
      case 'criar':
      case 'criou':
        return 'bg-green-100 text-green-800';
      case 'atualizar':
      case 'atualizou':
      case 'editar':
      case 'editou':
        return 'bg-blue-100 text-blue-800';
      case 'excluir':
      case 'excluiu':
      case 'deletar':
      case 'deletou':
        return 'bg-red-100 text-red-800';
      case 'visualizar':
      case 'visualizou':
      case 'acessar':
      case 'acessou':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const getModuloIcon = (modulo: string) => {
    switch (modulo.toLowerCase()) {
      case 'tickets':
        return '🎫';
      case 'ativos':
        return '💻';
      case 'projetos':
        return '📋';
      case 'usuarios':
        return '👥';
      case 'licencas':
        return '📜';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Auditoria</h1>
          <p className="text-gray-600 dark:text-gray-400">Rastreamento de todas as ações dos usuários</p>
        </div>
        <Shield className="h-8 w-8 text-blue-600" />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filtros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Módulo
            </label>
            <select
              value={filtros.modulo}
              onChange={(e) => setFiltros({ ...filtros, modulo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Todos</option>
              <option value="tickets">Tickets</option>
              <option value="ativos">Ativos</option>
              <option value="projetos">Projetos</option>
              <option value="usuarios">Usuários</option>
              <option value="licencas">Licenças</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ação
            </label>
            <select
              value={filtros.acao}
              onChange={(e) => setFiltros({ ...filtros, acao: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Todas</option>
              <option value="criar">Criar</option>
              <option value="atualizar">Atualizar</option>
              <option value="excluir">Excluir</option>
              <option value="visualizar">Visualizar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Início
            </label>
            <input
              type="date"
              value={filtros.data_inicio}
              onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Fim
            </label>
            <input
              type="date"
              value={filtros.data_fim}
              onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={carregarLogs}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Carregando...' : 'Buscar'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Logs de Atividade ({logs.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Nenhum log encontrado
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{getModuloIcon(log.modulo)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-1 rounded ${getAcaoColor(log.acao)}`}>
                          {log.acao}
                        </span>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {log.modulo}
                        </span>
                        {log.registro_id && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {log.registro_id}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {log.usuario_nome || 'Sistema'}
                        </span>
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                        <span>{new Date(log.criado_em).toLocaleString('pt-BR')}</span>
                      </div>
                      {log.detalhes && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400 font-mono">
                          {JSON.stringify(log.detalhes, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
