import { useState, useEffect } from 'react';
import { AlertTriangle, MessageCircle, Key, RefreshCw, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LicencaStatus {
  whatsapp: string;
  empresa?: string;
  expirada: boolean;
}

const WHATSAPP_CONTATO = '5534998408523';

export default function LicencaExpirada() {
  const [status, setStatus] = useState<LicencaStatus | null>(null);
  const [chave, setChave] = useState('');
  const [ativando, setAtivando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    carregarStatus();
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const carregarStatus = async () => {
    try {
      const response = await fetch('/api/licenca-sistema/status');
      const data = await response.json();
      setStatus(data);
      
      if (!data.expirada) {
        navigate('/');
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const ativarLicenca = async () => {
    if (!chave.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Digite a chave de licença' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMensagem({ tipo: 'erro', texto: 'Você precisa fazer login como administrador para ativar a licença' });
      return;
    }

    setAtivando(true);
    setMensagem(null);

    try {
      const response = await fetch('/api/licenca-sistema/ativar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chave_licenca: chave })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao ativar licença');
      }
      
      setMensagem({ tipo: 'sucesso', texto: 'Licença ativada com sucesso! Recarregando...' });
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
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
      `Olá! Preciso renovar a licença do Sistema de Gestão T.I.\n\nEmpresa: ${status?.empresa || 'Não informada'}\nStatus: Licença expirada`
    );
    window.open(`https://wa.me/${whatsappNum}?text=${mensagemWpp}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-red-600 p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Licença Expirada</h1>
          <p className="text-red-100 mt-2">O acesso ao sistema está bloqueado</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              A licença do sistema expirou. Entre em contato para renovar e continuar utilizando o sistema.
            </p>
          </div>
          
          <button
            onClick={abrirWhatsApp}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            Renovar pelo WhatsApp
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">ou</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Key className="w-5 h-5 text-blue-600" />
              Já tem uma nova chave?
            </div>
            
            {!isLoggedIn && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm mb-3">
                  Você precisa estar logado como administrador para ativar uma nova licença.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  Fazer Login
                </button>
              </div>
            )}
            
            {isLoggedIn && (
              <>
                <textarea
                  value={chave}
                  onChange={(e) => setChave(e.target.value)}
                  placeholder="Cole a chave de licença aqui..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 font-mono text-sm"
                />
                
                {mensagem && (
                  <div className={`p-3 rounded-lg ${
                    mensagem.tipo === 'sucesso' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {mensagem.texto}
                  </div>
                )}
                
                <button
                  onClick={ativarLicenca}
                  disabled={ativando || !chave.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  {ativando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Ativando...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Ativar Licença
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
