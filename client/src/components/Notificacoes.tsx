import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Notificacao {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
  lida: boolean;
  criado_em: string;
}

export default function Notificacoes({ usuarioId }: { usuarioId: number }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [mostrar, setMostrar] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    const socket: Socket = io({ path: '/socket.io' });

    carregarNotificacoes();
    carregarNaoLidas();

    socket.on('connect', () => {
      socket.emit('join', usuarioId);
    });

    socket.on('notificacao', (novaNotificacao: Notificacao) => {
      setNotificacoes(prev => [novaNotificacao, ...prev]);
      setNaoLidas(prev => prev + 1);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nova Notificação', {
          body: novaNotificacao.mensagem,
          icon: '/bell-icon.png'
        });
      }
    });

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('notificacao');
      socket.emit('leave', usuarioId);
      socket.disconnect();
    };
  }, [usuarioId]);

  const carregarNotificacoes = async () => {
    try {
      const response = await fetch(`/api/notificacoes?usuario_id=${usuarioId}`);
      const data = await response.json();
      setNotificacoes(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const carregarNaoLidas = async () => {
    try {
      const response = await fetch(`/api/notificacoes/nao-lidas/${usuarioId}`);
      const data = await response.json();
      setNaoLidas(data.total);
    } catch (error) {
      console.error('Erro ao carregar notificações não lidas:', error);
    }
  };

  const marcarComoLida = async (id: number) => {
    try {
      await fetch(`/api/notificacoes/${id}/ler`, {
        method: 'PATCH'
      });
      
      setNotificacoes(prev =>
        prev.map(n => n.id === id ? { ...n, lida: true } : n)
      );
      setNaoLidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      await fetch(`/api/notificacoes/ler-todas/${usuarioId}`, {
        method: 'PATCH'
      });
      
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      setNaoLidas(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'sucesso': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'aviso': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'erro': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMostrar(!mostrar)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <Bell className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {mostrar && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notificações</h3>
            <div className="flex gap-2">
              {naoLidas > 0 && (
                <button
                  onClick={marcarTodasComoLidas}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setMostrar(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Nenhuma notificação
              </div>
            ) : (
              notificacoes.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer ${
                    !notif.lida ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => !notif.lida && marcarComoLida(notif.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${getTipoColor(notif.tipo)}`}>
                          {notif.tipo}
                        </span>
                        <h4 className="font-medium text-gray-800 dark:text-gray-100">{notif.titulo}</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notif.mensagem}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(notif.criado_em).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {!notif.lida && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full ml-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
