import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, QrCode as QrCodeIcon, Scan } from 'lucide-react';

interface QRCodeGeneratorProps {
  ativoId: number;
  ativoNome: string;
}

export default function QRCodeGenerator({ ativoId, ativoNome }: QRCodeGeneratorProps) {
  const [qrData, setQrData] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarQRCode();
  }, [ativoId]);

  const carregarQRCode = async () => {
    try {
      let response = await fetch(`/api/qrcode/ativo/${ativoId}`);
      
      if (response.status === 404) {
        response = await fetch(`/api/qrcode/gerar/${ativoId}`, {
          method: 'POST'
        });
      }

      const data = await response.json();
      setQrData(data.qr_code_data);
    } catch (error) {
      console.error('Erro ao carregar QR Code:', error);
    } finally {
      setLoading(false);
    }
  };

  const baixarQRCode = () => {
    const canvas = document.getElementById(`qrcode-${ativoId}`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode-${ativoNome.replace(/\s+/g, '-')}.png`;
      link.href = url;
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 text-gray-700">
        <QrCodeIcon className="h-5 w-5" />
        <h3 className="font-semibold">QR Code do Ativo</h3>
      </div>

      <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
        <QRCodeCanvas
          id={`qrcode-${ativoId}`}
          value={qrData}
          size={200}
          level="H"
          includeMargin={true}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={baixarQRCode}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Download className="h-4 w-4" />
          Baixar QR Code
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center max-w-xs">
        Use este QR Code para identificar e rastrear o ativo rapidamente com um dispositivo móvel
      </p>
    </div>
  );
}

export function QRScanner() {
  const [codigo, setCodigo] = useState('');
  const [ativo, setAtivo] = useState<any>(null);

  const buscarAtivo = async () => {
    if (!codigo) return;

    try {
      const response = await fetch(`/api/qrcode/scan/${codigo}`);
      if (response.ok) {
        const data = await response.json();
        setAtivo(data);
      } else {
        alert('QR Code inválido');
      }
    } catch (error) {
      console.error('Erro ao buscar ativo:', error);
      alert('Erro ao buscar ativo');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Digite o código do QR ou escaneie"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={buscarAtivo}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Scan className="h-5 w-5" />
          Buscar
        </button>
      </div>

      {ativo && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Ativo Encontrado</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Nome:</span> {ativo.nome}</p>
            <p><span className="font-medium">Tipo:</span> {ativo.tipo}</p>
            <p><span className="font-medium">Marca:</span> {ativo.marca}</p>
            <p><span className="font-medium">Modelo:</span> {ativo.modelo}</p>
            <p><span className="font-medium">Status:</span> {ativo.status}</p>
            {ativo.responsavel_nome && (
              <p><span className="font-medium">Responsável:</span> {ativo.responsavel_nome}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
