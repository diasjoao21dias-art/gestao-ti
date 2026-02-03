import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { 
  HardDrive, 
  Ticket, 
  FolderKanban, 
  Key
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import KPICard from '../components/KPICard'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    
    // Auto-refresh a cada 2 minutos (120 segundos) para evitar recarregamentos frequentes
    const interval = setInterval(() => {
      loadStats()
    }, 120000)

    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      console.log('Iniciando carregamento de stats...')
      const data = await api.dashboard.getStats()
      console.log('Dados recebidos:', data)
      setStats(data)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 md:mt-2">Visão geral do sistema de gestão de T.I.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Ativos"
          value={stats?.resumo?.totalAtivos || 0}
          subtitle={`${stats?.resumo?.ativosAtivos || 0} ativos`}
          icon={<HardDrive className="w-6 h-6" />}
          color="primary"
          trend="up"
          trendValue="+5%"
          onClick={() => navigate('/ativos')}
        />
        <KPICard
          title="Tickets"
          value={stats?.resumo?.totalTickets || 0}
          subtitle={`${stats?.resumo?.ticketsAbertos || 0} abertos`}
          icon={<Ticket className="w-6 h-6" />}
          color="success"
          trend="down"
          trendValue="-12%"
          onClick={() => navigate('/tickets')}
        />
        <KPICard
          title="Projetos"
          value={stats?.resumo?.totalProjetos || 0}
          subtitle={`${stats?.resumo?.projetosAtivos || 0} em andamento`}
          icon={<FolderKanban className="w-6 h-6" />}
          color="secondary"
          trend="up"
          trendValue="+8%"
          onClick={() => navigate('/projetos')}
        />
        <KPICard
          title="Licenças"
          value={stats?.resumo?.totalLicencas || 0}
          subtitle={`${stats?.resumo?.licencasExpirando || 0} expirando`}
          icon={<Key className="w-6 h-6" />}
          color="warning"
          trend="neutral"
          trendValue="0%"
          onClick={() => navigate('/licencas')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="card card-body animate-slide-in">
          <h2 className="text-lg md:text-xl font-semibold mb-4 dark:text-gray-100">Tickets por Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.graficos?.ticketsPorStatus || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Bar dataKey="quantidade" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-body animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg md:text-xl font-semibold mb-4 dark:text-gray-100">Ativos por Tipo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.graficos?.ativosPorTipo || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ tipo, quantidade }) => `${tipo}: ${quantidade}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="quantidade"
              >
                {(stats?.graficos?.ativosPorTipo || []).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Tickets Recentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stats?.recentes?.tickets?.map((ticket: any) => (
                <tr key={ticket.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">#{ticket.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{ticket.titulo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ticket.solicitante_nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ticket.prioridade === 'alta' ? 'bg-red-100 text-red-800' :
                      ticket.prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.prioridade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ticket.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

