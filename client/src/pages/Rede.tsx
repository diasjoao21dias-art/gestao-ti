import { useState, useEffect } from 'react'
import { 
  Network, Wifi, Globe, Server, Plus, Edit, Trash2, 
  Search, Router
} from 'lucide-react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import Alert from '../components/Alert'

interface Vlan {
  id: number
  numero: number
  nome: string
  descricao: string
  gateway: string
  mascara: string
  localizacao_nome: string
  total_subnets: number
}

interface Subnet {
  id: number
  cidr: string
  nome: string
  descricao: string
  vlan_id: number
  vlan_nome: string
  vlan_numero: number
  gateway: string
  dns_primario: string
  dns_secundario: string
  total_ips: number
}

interface EnderecoIP {
  id: number
  ip: string
  subnet_id: number
  subnet_cidr: string
  subnet_nome: string
  ativo_id: number
  ativo_nome: string
  hostname: string
  mac_address: string
  tipo: string
  status: string
  descricao: string
  reservado: boolean
}

interface RedeDashboard {
  vlans: number
  subnets: number
  ips: {
    total: number
    em_uso: number
    disponiveis: number
  }
  equipamentos_rede: number
}

interface Roteador {
  id: number
  nome: string
  marca: string
  modelo: string
  numero_serie: string
  ip_address: string
  mac_address: string
  localizacao_id: number
  localizacao_nome: string
  especificacoes: {
    gateway?: string
    dns_primario?: string
    dns_secundario?: string
    ssid?: string
    senha_wifi?: string
    tipo_conexao?: string
    velocidade?: string
    firmware?: string
  }
  observacoes: string
}

const tabs = [
  { id: 'dashboard', label: 'Visão Geral', icon: Network },
  { id: 'vlans', label: 'VLANs', icon: Wifi },
  { id: 'subnets', label: 'Subnets', icon: Globe },
  { id: 'ips', label: 'Endereços IP', icon: Server },
  { id: 'roteadores', label: 'Roteadores', icon: Router },
]

const statusColors: Record<string, string> = {
  disponivel: 'bg-green-100 text-green-800',
  em_uso: 'bg-blue-100 text-blue-800',
  reservado: 'bg-purple-100 text-purple-800',
}

export default function Rede() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [dashboard, setDashboard] = useState<RedeDashboard | null>(null)
  const [vlans, setVlans] = useState<Vlan[]>([])
  const [subnets, setSubnets] = useState<Subnet[]>([])
  const [ips, setIps] = useState<EnderecoIP[]>([])
  const [localizacoes, setLocalizacoes] = useState<any[]>([])
  const [ativos, setAtivos] = useState<any[]>([])
  const [roteadores, setRoteadores] = useState<Roteador[]>([])
  
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'vlan' | 'subnet' | 'ip' | 'roteador'>('vlan')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dashRes, vlansRes, subnetsRes, ipsRes, locRes, ativosRes, roteadoresRes] = await Promise.all([
        api.rede.getDashboard(),
        api.rede.getVlans(),
        api.rede.getSubnets(),
        api.rede.getIps(),
        api.inventario.getLocalizacoes(),
        api.ativos.getAll({ tipo: 'rede' }),
        api.rede.getRoteadores(),
      ])
      setDashboard(dashRes)
      setVlans(vlansRes)
      setSubnets(subnetsRes)
      setIps(ipsRes)
      setLocalizacoes(locRes)
      setAtivos(ativosRes)
      setRoteadores(roteadoresRes)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (modalType === 'vlan') {
        if (editingItem) {
          await api.rede.updateVlan(editingItem.id, formData)
        } else {
          await api.rede.createVlan(formData)
        }
        setSuccess('VLAN salva com sucesso!')
      } else if (modalType === 'subnet') {
        if (editingItem) {
          await api.rede.updateSubnet(editingItem.id, formData)
        } else {
          await api.rede.createSubnet(formData)
        }
        setSuccess('Subnet salva com sucesso!')
      } else if (modalType === 'ip') {
        if (editingItem) {
          await api.rede.updateIp(editingItem.id, formData)
        } else {
          await api.rede.createIp(formData)
        }
        setSuccess('Endereço IP salvo com sucesso!')
      } else if (modalType === 'roteador') {
        const roteadorData = {
          ...formData,
          gateway: formData.especificacoes?.gateway || formData.gateway,
          dns_primario: formData.especificacoes?.dns_primario || formData.dns_primario,
          dns_secundario: formData.especificacoes?.dns_secundario || formData.dns_secundario,
          ssid: formData.especificacoes?.ssid || formData.ssid,
          senha_wifi: formData.especificacoes?.senha_wifi || formData.senha_wifi,
          tipo_conexao: formData.especificacoes?.tipo_conexao || formData.tipo_conexao,
          velocidade: formData.especificacoes?.velocidade || formData.velocidade,
          firmware: formData.especificacoes?.firmware || formData.firmware,
        }
        if (editingItem) {
          await api.rede.updateRoteador(editingItem.id, roteadorData)
        } else {
          await api.rede.createRoteador(roteadorData)
        }
        setSuccess('Roteador salvo com sucesso!')
      }
      setShowModal(false)
      setEditingItem(null)
      setFormData({})
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return
    try {
      if (type === 'vlan') {
        await api.rede.deleteVlan(id)
        setSuccess('VLAN excluída com sucesso!')
      } else if (type === 'subnet') {
        await api.rede.deleteSubnet(id)
        setSuccess('Subnet excluída com sucesso!')
      } else if (type === 'ip') {
        await api.rede.deleteIp(id)
        setSuccess('IP excluído com sucesso!')
      } else if (type === 'roteador') {
        await api.rede.deleteRoteador(id)
        setSuccess('Roteador excluído com sucesso!')
      }
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const openModal = (type: 'vlan' | 'subnet' | 'ip' | 'roteador', item?: any) => {
    setModalType(type)
    setEditingItem(item || null)
    setFormData(item || {})
    setShowModal(true)
  }

  const filteredIps = ips.filter(ip =>
    !searchTerm ||
    ip.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ip.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ip.ativo_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Inventário de Rede
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gestão de VLANs, Subnets e Endereços IP
        </p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'dashboard' && dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">VLANs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard.vlans}</p>
              </div>
              <Wifi className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Subnets</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard.subnets}</p>
              </div>
              <Globe className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Endereços IP</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard.ips.total}</p>
              </div>
              <Server className="w-12 h-12 text-purple-500" />
            </div>
            <div className="mt-2 text-sm">
              <span className="text-blue-600">{dashboard.ips.em_uso} em uso</span>
              <span className="mx-2">|</span>
              <span className="text-green-600">{dashboard.ips.disponiveis} disponíveis</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Equipamentos de Rede</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard.equipamentos_rede}</p>
              </div>
              <Network className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vlans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => openModal('vlan')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nova VLAN
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Gateway</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Máscara</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subnets</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {vlans.map(vlan => (
                  <tr key={vlan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      VLAN {vlan.numero}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{vlan.nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{vlan.gateway || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{vlan.mascara || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{vlan.total_subnets}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal('vlan', vlan)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete('vlan', vlan.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'subnets' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => openModal('subnet')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nova Subnet
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">CIDR</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">VLAN</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Gateway</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">IPs</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {subnets.map(subnet => (
                  <tr key={subnet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{subnet.cidr}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{subnet.nome || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {subnet.vlan_numero ? `VLAN ${subnet.vlan_numero}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{subnet.gateway || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{subnet.total_ips}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openModal('subnet', subnet)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ips' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por IP, hostname, ativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white w-64"
              />
            </div>
            <button
              onClick={() => openModal('ip')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Novo IP
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Hostname</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">MAC</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subnet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ativo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredIps.map(ip => (
                  <tr key={ip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{ip.ip}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{ip.hostname || '-'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">{ip.mac_address || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{ip.subnet_cidr || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{ip.ativo_nome || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[ip.status]}`}>
                        {ip.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal('ip', ip)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete('ip', ip.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roteadores' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => openModal('roteador')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Novo Roteador
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Marca/Modelo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Localização</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">SSID</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {roteadores.map(roteador => (
                  <tr key={roteador.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{roteador.nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{roteador.marca} {roteador.modelo}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{roteador.ip_address || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{roteador.localizacao_nome || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{roteador.especificacoes?.ssid || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal('roteador', roteador)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete('roteador', roteador.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {roteadores.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Nenhum roteador cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingItem(null); setFormData({}) }}
        title={
          modalType === 'vlan' ? (editingItem ? 'Editar VLAN' : 'Nova VLAN') :
          modalType === 'subnet' ? (editingItem ? 'Editar Subnet' : 'Nova Subnet') :
          modalType === 'roteador' ? (editingItem ? 'Editar Roteador' : 'Novo Roteador') :
          (editingItem ? 'Editar IP' : 'Novo IP')
        }
      >
        <div className="space-y-4">
          {modalType === 'vlan' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Número *</label>
                  <input
                    type="number"
                    value={formData.numero || ''}
                    onChange={(e) => setFormData({ ...formData, numero: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Nome *</label>
                  <input
                    type="text"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Gateway</label>
                  <input
                    type="text"
                    value={formData.gateway || ''}
                    onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                    placeholder="Ex: 192.168.1.1"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Máscara</label>
                  <input
                    type="text"
                    value={formData.mascara || ''}
                    onChange={(e) => setFormData({ ...formData, mascara: e.target.value })}
                    placeholder="Ex: 255.255.255.0"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Descrição</label>
                <textarea
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </>
          )}

          {modalType === 'subnet' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">CIDR *</label>
                  <input
                    type="text"
                    value={formData.cidr || ''}
                    onChange={(e) => setFormData({ ...formData, cidr: e.target.value })}
                    placeholder="Ex: 192.168.1.0/24"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Nome</label>
                  <input
                    type="text"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">VLAN</label>
                  <select
                    value={formData.vlan_id || ''}
                    onChange={(e) => setFormData({ ...formData, vlan_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    {vlans.map(v => (
                      <option key={v.id} value={v.id}>VLAN {v.numero} - {v.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Gateway</label>
                  <input
                    type="text"
                    value={formData.gateway || ''}
                    onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">DNS Primário</label>
                  <input
                    type="text"
                    value={formData.dns_primario || ''}
                    onChange={(e) => setFormData({ ...formData, dns_primario: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">DNS Secundário</label>
                  <input
                    type="text"
                    value={formData.dns_secundario || ''}
                    onChange={(e) => setFormData({ ...formData, dns_secundario: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </>
          )}

          {modalType === 'ip' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Endereço IP *</label>
                  <input
                    type="text"
                    value={formData.ip || ''}
                    onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                    placeholder="Ex: 192.168.1.100"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Hostname</label>
                  <input
                    type="text"
                    value={formData.hostname || ''}
                    onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">MAC Address</label>
                  <input
                    type="text"
                    value={formData.mac_address || ''}
                    onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                    placeholder="Ex: 00:1A:2B:3C:4D:5E"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Subnet</label>
                  <select
                    value={formData.subnet_id || ''}
                    onChange={(e) => setFormData({ ...formData, subnet_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    {subnets.map(s => (
                      <option key={s.id} value={s.id}>{s.cidr} - {s.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Ativo Vinculado</label>
                  <select
                    value={formData.ativo_id || ''}
                    onChange={(e) => setFormData({ ...formData, ativo_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Nenhum</option>
                    {ativos.map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Status</label>
                  <select
                    value={formData.status || 'disponivel'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_uso">Em Uso</option>
                    <option value="reservado">Reservado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Descrição</label>
                <input
                  type="text"
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </>
          )}

          {modalType === 'roteador' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Nome *</label>
                  <input
                    type="text"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Roteador UTI"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Localização</label>
                  <select
                    value={formData.localizacao_id || ''}
                    onChange={(e) => setFormData({ ...formData, localizacao_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    {localizacoes.map(l => (
                      <option key={l.id} value={l.id}>{l.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Marca</label>
                  <input
                    type="text"
                    value={formData.marca || ''}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Ex: TP-Link, Cisco, Mikrotik"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Modelo</label>
                  <input
                    type="text"
                    value={formData.modelo || ''}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Número de Série</label>
                  <input
                    type="text"
                    value={formData.numero_serie || ''}
                    onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Endereço IP</label>
                  <input
                    type="text"
                    value={formData.ip_address || ''}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    placeholder="Ex: 192.168.1.1"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">MAC Address</label>
                  <input
                    type="text"
                    value={formData.mac_address || ''}
                    onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                    placeholder="Ex: 00:1A:2B:3C:4D:5E"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Gateway</label>
                  <input
                    type="text"
                    value={formData.gateway || formData.especificacoes?.gateway || ''}
                    onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                    placeholder="Ex: 192.168.1.1"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">DNS Primário</label>
                  <input
                    type="text"
                    value={formData.dns_primario || formData.especificacoes?.dns_primario || ''}
                    onChange={(e) => setFormData({ ...formData, dns_primario: e.target.value })}
                    placeholder="Ex: 8.8.8.8"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">DNS Secundário</label>
                  <input
                    type="text"
                    value={formData.dns_secundario || formData.especificacoes?.dns_secundario || ''}
                    onChange={(e) => setFormData({ ...formData, dns_secundario: e.target.value })}
                    placeholder="Ex: 8.8.4.4"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">SSID (Nome do Wi-Fi)</label>
                  <input
                    type="text"
                    value={formData.ssid || formData.especificacoes?.ssid || ''}
                    onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Senha Wi-Fi</label>
                  <input
                    type="text"
                    value={formData.senha_wifi || formData.especificacoes?.senha_wifi || ''}
                    onChange={(e) => setFormData({ ...formData, senha_wifi: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Tipo de Conexão</label>
                  <select
                    value={formData.tipo_conexao || formData.especificacoes?.tipo_conexao || ''}
                    onChange={(e) => setFormData({ ...formData, tipo_conexao: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="fibra">Fibra Óptica</option>
                    <option value="cabo">Cabo Ethernet</option>
                    <option value="wireless">Wireless</option>
                    <option value="4g">4G/5G</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Velocidade</label>
                  <input
                    type="text"
                    value={formData.velocidade || formData.especificacoes?.velocidade || ''}
                    onChange={(e) => setFormData({ ...formData, velocidade: e.target.value })}
                    placeholder="Ex: 100 Mbps"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Versão do Firmware</label>
                <input
                  type="text"
                  value={formData.firmware || formData.especificacoes?.firmware || ''}
                  onChange={(e) => setFormData({ ...formData, firmware: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Observações</label>
                <textarea
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => { setShowModal(false); setEditingItem(null); setFormData({}) }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
