import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash, UserPlus, UserMinus } from 'lucide-react';
import Modal from '../components/Modal';

interface Setor {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
  total_tecnicos: number;
}

interface Tecnico {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  vinculado_em?: string;
}

export default function Setores() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [tecnicosSetor, setTecnicosSetor] = useState<Tecnico[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalTecnicos, setModalTecnicos] = useState(false);
  const [setorSelecionado, setSetorSelecionado] = useState<Setor | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });

  useEffect(() => {
    carregarSetores();
    carregarTecnicos();
  }, []);

  const carregarSetores = async () => {
    try {
      const response = await fetch('/api/setores', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSetores(data);
      }
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const carregarTecnicos = async () => {
    try {
      const response = await fetch('/api/usuarios', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const tecnicosAdmins = data.filter((u: any) => 
          u.nivel_permissao === 'tecnico' || u.nivel_permissao === 'admin'
        );
        setTecnicos(tecnicosAdmins);
      }
    } catch (error) {
      console.error('Erro ao carregar técnicos:', error);
    }
  };

  const carregarTecnicosSetor = async (setorId: number) => {
    try {
      const response = await fetch(`/api/setores/${setorId}/tecnicos`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTecnicosSetor(data);
      }
    } catch (error) {
      console.error('Erro ao carregar técnicos do setor:', error);
    }
  };

  const salvarSetor = async () => {
    setLoading(true);
    try {
      const url = setorSelecionado 
        ? `/api/setores/${setorSelecionado.id}` 
        : '/api/setores';
      const method = setorSelecionado ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setModalAberto(false);
        setFormData({ nome: '', descricao: '' });
        setSetorSelecionado(null);
        carregarSetores();
      }
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
    } finally {
      setLoading(false);
    }
  };

  const excluirSetor = async (id: number) => {
    if (!confirm('Deseja realmente excluir este setor?')) return;

    try {
      const response = await fetch(`/api/setores/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        carregarSetores();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao excluir setor');
      }
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
    }
  };

  const vincularTecnico = async (tecnicoId: number) => {
    if (!setorSelecionado) return;

    try {
      const response = await fetch(`/api/setores/${setorSelecionado.id}/tecnicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tecnico_id: tecnicoId })
      });

      if (response.ok) {
        carregarTecnicosSetor(setorSelecionado.id);
        carregarSetores();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao vincular técnico');
      }
    } catch (error) {
      console.error('Erro ao vincular técnico:', error);
    }
  };

  const desvincularTecnico = async (tecnicoId: number) => {
    if (!setorSelecionado) return;
    if (!confirm('Deseja desvincular este técnico do setor?')) return;

    try {
      const response = await fetch(`/api/setores/${setorSelecionado.id}/tecnicos/${tecnicoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        carregarTecnicosSetor(setorSelecionado.id);
        carregarSetores();
      }
    } catch (error) {
      console.error('Erro ao desvincular técnico:', error);
    }
  };

  const abrirModalEdicao = (setor: Setor) => {
    setSetorSelecionado(setor);
    setFormData({ nome: setor.nome, descricao: setor.descricao });
    setModalAberto(true);
  };

  const abrirModalTecnicos = (setor: Setor) => {
    setSetorSelecionado(setor);
    carregarTecnicosSetor(setor.id);
    setModalTecnicos(true);
  };

  const tecnicosDisponiveis = tecnicos.filter(
    t => !tecnicosSetor.find(ts => ts.id === t.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Setores</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie os setores e vincule técnicos</p>
        </div>
        <button
          onClick={() => {
            setSetorSelecionado(null);
            setFormData({ nome: '', descricao: '' });
            setModalAberto(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          Novo Setor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {setores.map(setor => (
          <div key={setor.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{setor.nome}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{setor.descricao}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => abrirModalEdicao(setor)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Editar"
                >
                  <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => excluirSetor(setor.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                  title="Excluir"
                >
                  <Trash className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {setor.total_tecnicos} técnico{setor.total_tecnicos !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => abrirModalTecnicos(setor)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Users className="h-4 w-4" />
                Gerenciar
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} title={setorSelecionado ? 'Editar Setor' : 'Novo Setor'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Suporte Técnico"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descreva as responsabilidades do setor"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setModalAberto(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              onClick={salvarSetor}
              disabled={loading || !formData.nome}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalTecnicos} onClose={() => setModalTecnicos(false)} title={`Técnicos - ${setorSelecionado?.nome}`}>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Técnicos Vinculados</h3>
            {tecnicosSetor.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum técnico vinculado</p>
            ) : (
              <div className="space-y-2">
                {tecnicosSetor.map(tecnico => (
                  <div key={tecnico.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{tecnico.nome}</p>
                      <p className="text-sm text-gray-600">{tecnico.cargo || tecnico.email}</p>
                    </div>
                    <button
                      onClick={() => desvincularTecnico(tecnico.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Desvincular"
                    >
                      <UserMinus className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {tecnicosDisponiveis.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Adicionar Técnico</h3>
              <div className="space-y-2">
                {tecnicosDisponiveis.map(tecnico => (
                  <div key={tecnico.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{tecnico.nome}</p>
                      <p className="text-sm text-gray-600">{tecnico.cargo || tecnico.email}</p>
                    </div>
                    <button
                      onClick={() => vincularTecnico(tecnico.id)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition"
                      title="Vincular"
                    >
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
