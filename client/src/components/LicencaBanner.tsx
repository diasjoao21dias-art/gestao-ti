import { useState, useEffect } from 'react';
import { AlertTriangle, X, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface LicencaStatus {
  valida: boolean;
  empresa?: string;
  diasRestantes: number;
  expirada: boolean;
  proximoVencimento: boolean;
  whatsapp: string;
}

const WHATSAPP_CONTATO = '5534998408523';

export default function LicencaBanner() {
  const [status, setStatus] = useState<LicencaStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLicense = async () => {
      try {
        const data = await api.get('/licenca-sistema/status');
        setStatus(data);
        
        if (data.expirada) {
          navigate('/licenca-expirada');
        }
      } catch (error) {
        console.error('Erro ao verificar licença:', error);
      }
    };

    checkLicense();
    const interval = setInterval(checkLicense, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  if (!status || !status.proximoVencimento || dismissed) {
    return null;
  }

  const abrirWhatsApp = () => {
    const whatsappNum = status?.whatsapp || WHATSAPP_CONTATO;
    const mensagem = encodeURIComponent(
      `Olá! Preciso renovar a licença do Sistema de Gestão T.I.\n\nEmpresa: ${status?.empresa || 'Não informada'}\nDias restantes: ${status?.diasRestantes}`
    );
    window.open(`https://wa.me/${whatsappNum}?text=${mensagem}`, '_blank');
  };

  return (
    <div className="bg-yellow-500 text-white px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">
            Atenção: Sua licença expira em {status.diasRestantes} dias.
          </span>
          <Link 
            to="/licenca-sistema" 
            className="underline hover:no-underline"
          >
            Ver detalhes
          </Link>
          <button
            onClick={abrirWhatsApp}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Renovar
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="hover:bg-yellow-600 p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
