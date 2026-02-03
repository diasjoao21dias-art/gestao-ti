import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader } from 'lucide-react';

interface UploadArquivosProps {
  ticketId: number;
  usuarioId: number;
  onUploadComplete?: () => void;
}

export default function UploadArquivos({ ticketId, usuarioId, onUploadComplete }: UploadArquivosProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('usuario_id', usuarioId.toString());

    setUploading(true);
    setError('');

    try {
      const response = await fetch(`/api/uploads/ticket/${ticketId}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload');
      }

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  }, [ticketId, usuarioId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    }
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="mt-2 text-sm text-gray-600">Fazendo upload...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Solte o arquivo aqui'
                : 'Arraste um arquivo ou clique para selecionar'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOC, DOCX, TXT, ZIP, RAR, Imagens (máx. 10MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError('')}>
            <X className="h-4 w-4 text-red-400" />
          </button>
        </div>
      )}
    </div>
  );
}

interface Anexo {
  id: number;
  nome_arquivo: string;
  tamanho_bytes: number;
  tipo_mime: string;
  usuario_nome: string;
  criado_em: string;
}

export function ListaAnexos({ ticketId }: { ticketId: number }) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);

  const carregarAnexos = async () => {
    try {
      const response = await fetch(`/api/uploads/ticket/${ticketId}`);
      const data = await response.json();
      setAnexos(data);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
    }
  };

  const excluirAnexo = async (id: number) => {
    if (!confirm('Deseja excluir este anexo?')) return;

    try {
      await fetch(`/api/uploads/${id}`, { method: 'DELETE' });
      await carregarAnexos();
    } catch (error) {
      console.error('Erro ao excluir anexo:', error);
    }
  };

  const formatarTamanho = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  useEffect(() => {
    carregarAnexos();
  }, [ticketId]);

  return (
    <div className="space-y-2">
      {anexos.map(anexo => (
        <div
          key={anexo.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-800">{anexo.nome_arquivo}</p>
              <p className="text-xs text-gray-500">
                {formatarTamanho(anexo.tamanho_bytes)} • {anexo.usuario_nome} • {' '}
                {new Date(anexo.criado_em).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <button
            onClick={() => excluirAnexo(anexo.id)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
}
