import { useState, useEffect } from 'react';
import { Key, AlertTriangle, CheckCircle, Clock, MessageCircle, Shield } from 'lucide-react';
import { api } from '../services/api';

interface LicencaStatus {
  valida: boolean;
  empresa?: string;
  dataExpiracao?: string;
  diasRestantes: number;
  expirada: boolean;
  proximoVencimento?: boolean;
  whatsapp: string;
}

const WHATSAPP_CONTATO = '5534998408523';

export default function LicencaSistema() {
  const [status, setStatus] = useState<LicencaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [chave, setChave] = useState('');
  const [ativando, setAtivando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);

  useEffect(() => {
    carregarStatus();
  }, []);

  const carregarStatus = async () => {
    try {
      const data = await api.get('/licenca-sistema/status');
      setStatus(data);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const isExpirada = status?.expirada || (status?.diasRestantes !== undefined && status.diasRestantes <= 0);
  const isProximoVencimento = !isExpirada && status?.diasRestantes !== undefined && status.diasRestantes <= 7;
  const precisaRenovar = isExpirada || isProximoVencimento;

  const ativarLicenca = async () => {
    if (!chave.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Digite a chave de licença' });
      return;
    }

    setAtivando(true);
    setMensagem(null);

    try {
      await api.post('/licenca-sistema/ativar', { chave_licenca: chave });
      setMensagem({ tipo: 'sucesso', texto: 'Licença ativada com sucesso!' });
      setChave('');
      carregarStatus();
    } catch (error: any) {
      setMensagem({ 
        tipo: 'erro', 
        texto: error.message || 'Erro ao ativar licença' 
      });
    } finally {
      setAtivando(false);
    }
  };

  const abrirWhatsApp = () => {
    const whatsappNum = status?.whatsapp || WHATSAPP_CONTATO;
    const mensagemWpp = encodeURIComponent(
      `Olá! Preciso renovar a licença do Sistema de Gestão T.I.\n\nEmpresa: ${status?.empresa || 'Não informada'}\nStatus: ${isExpirada ? 'Expirada' : `${status?.diasRestantes || 0} dias restantes`}`
    );
    window.open(`https://wa.me/${whatsappNum}?text=${mensagemWpp}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Licença do Sistema</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie a licença de uso do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl border-2 ${
          isExpirada 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
            : isProximoVencimento 
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${
              isExpirada 
                ? 'bg-red-100 dark:bg-red-900' 
                : isProximoVencimento 
                  ? 'bg-yellow-100 dark:bg-yellow-900'
                  : 'bg-green-100 dark:bg-green-900'
            }`}>
              {isExpirada ? (
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              ) : isProximoVencimento ? (
                <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${
                isExpirada 
                  ? 'text-red-800 dark:text-red-200' 
                  : isProximoVencimento 
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : 'text-green-800 dark:text-green-200'
              }`}>
                {isExpirada 
                  ? 'Licença Expirada' 
                  : isProximoVencimento 
                    ? 'Licença Prestes a Vencer'
                    : 'Licença Ativa'}
              </h2>
              
              {status?.empresa && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Empresa: <strong>{status.empresa}</strong>
                </p>
              )}
              
              {status?.dataExpiracao && (
                <p className="text-gray-600 dark:text-gray-400">
                  Validade: <strong>{new Date(status.dataExpiracao).toLocaleDateString('pt-BR')}</strong>
                </p>
              )}
              
              <div className={`mt-3 text-3xl font-bold ${
                isExpirada 
                  ? 'text-red-600 dark:text-red-400' 
                  : isProximoVencimento 
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-green-600 dark:text-green-400'
              }`}>
                {status?.diasRestantes || 0} dias restantes
              </div>

              <button
                onClick={abrirWhatsApp}
                className={`mt-4 flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
                  precisaRenovar 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                {precisaRenovar ? 'Renovar pelo WhatsApp' : 'Contato para Renovação'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Ativar Nova Licença
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Cole a chave de licença fornecida para ativar ou renovar sua licença.
          </p>
          
          <div className="space-y-4">
            <textarea
              value={chave}
              onChange={(e) => setChave(e.target.value)}
              placeholder="Cole a chave de licença aqui..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none h-32 font-mono text-sm"
            />
            
            {mensagem && (
              <div className={`p-3 rounded-lg ${
                mensagem.tipo === 'sucesso' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
              }`}>
                {mensagem.texto}
              </div>
            )}
            
            <button
              onClick={ativarLicenca}
              disabled={ativando || !chave.trim()}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              {ativando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Ativando...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Ativar Licença
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {isProximoVencimento && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Atenção: Licença expira em {status?.diasRestantes || 0} dias
              </h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                Renove sua licença para continuar utilizando o sistema sem interrupções.
                Após o vencimento, o acesso será bloqueado até a renovação.
              </p>
            </div>
          </div>
        </div>
      )}

      {isExpirada && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                Licença Expirada!
              </h4>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                Sua licença expirou. Entre em contato pelo WhatsApp para renovar e continuar utilizando o sistema.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
