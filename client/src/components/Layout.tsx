import { ReactNode, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Ticket, 
  FolderKanban, 
  Key, 
  Users, 
  BookOpen,
  Menu,
  LogOut,
  User,
  FileText,
  Shield,
  X,
  Moon,
  Sun,
  Search,
  Package,
  Network,
  Monitor
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Notificacoes from './Notificacoes'
import BuscaGlobal from './BuscaGlobal'
import LicencaBanner from './LicencaBanner'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [buscaOpen, setBuscaOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }
    
    checkMobile()
    
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setBuscaOpen(true)
      }
      if (e.key === 'Escape') {
        setBuscaOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getMenuItems = () => {
    const nivel = user?.nivel_permissao || 'usuario';
    
    if (nivel === 'usuario') {
      return [
        { path: '/tickets', icon: Ticket, label: 'Meus Tickets' },
        { path: '/conhecimento', icon: BookOpen, label: 'Base de Conhecimento' },
      ];
    }
    
    if (nivel === 'tecnico') {
      return [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/tickets', icon: Ticket, label: 'Tickets' },
        { path: '/conhecimento', icon: BookOpen, label: 'Conhecimento' },
      ];
    }
    
    return [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/inventario', icon: Package, label: 'Inventário' },
      { path: '/maquinas', icon: Monitor, label: 'Máquinas' },
      { path: '/rede', icon: Network, label: 'Rede' },
      { path: '/tickets', icon: Ticket, label: 'Tickets' },
      { path: '/projetos', icon: FolderKanban, label: 'Projetos' },
      { path: '/licencas', icon: Key, label: 'Licenças' },
      { path: '/usuarios', icon: Users, label: 'Usuários' },
      { path: '/setores', icon: Users, label: 'Setores' },
      { path: '/conhecimento', icon: BookOpen, label: 'Conhecimento' },
      { path: '/relatorios', icon: FileText, label: 'Relatórios' },
      { path: '/auditoria', icon: Shield, label: 'Auditoria' },
      { path: '/licenca-sistema', icon: Key, label: 'Licença Sistema' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside
        className={`
          bg-primary-700 dark:bg-gray-800 text-white
          transition-all duration-300 ease-in-out overflow-hidden
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative flex-shrink-0'}
          ${sidebarOpen ? 'w-64 shadow-2xl' : 'w-0'}
        `}
      >
        <div className="w-64 h-full flex flex-col animate-slide-in">
          <div className="p-4 flex items-center justify-center border-b border-primary-600 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-med-center.png" 
                alt="Hospital Med Center" 
                className="h-12 w-auto"
              />
              <div className="flex flex-col">
                <span className="text-white font-semibold text-sm leading-tight">Sistema de Gestão</span>
                <span className="text-white font-semibold text-sm leading-tight">em T.I.</span>
              </div>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-primary-600 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 flex-shrink-0"
                title="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <nav className="mt-2 flex-1 overflow-y-auto scrollbar-thin px-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              const isExternal = 'external' in item && item.external
              
              const linkClassName = `
                flex items-center gap-3 px-4 py-3 my-1 rounded-lg
                transition-all duration-200 whitespace-nowrap group
                ${isActive 
                  ? 'bg-primary-800 dark:bg-gray-900 shadow-md font-medium' 
                  : 'hover:bg-primary-600 dark:hover:bg-gray-700'
                }
              `
              
              if (isExternal) {
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={linkClassName}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-sm">{item.label}</span>
                  </a>
                )
              }
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={linkClassName}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        <LicencaBanner />
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={sidebarOpen ? 'Ocultar menu' : 'Expandir menu'}
              >
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
              <User className="w-8 h-8 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full p-1.5" />
              <div className="hidden sm:block">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{user?.nome}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.cargo || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <button
                onClick={() => setBuscaOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Busca Global (Ctrl+K)"
              >
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-300" />
                )}
              </button>
              {user?.id && <Notificacoes usuarioId={user.id} />}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 lg:p-8 dark:bg-gray-900 pb-16">
          {children}
        </div>
        
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-4 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Sistema de Gestão em T.I - v3.0 - 01/10/2025</span>
            <span>© {new Date().getFullYear()} - Direitos Reservados - Sistemas Olivium</span>
          </div>
        </footer>
      </main>
      
      <BuscaGlobal isOpen={buscaOpen} onClose={() => setBuscaOpen(false)} />
    </div>
  )
}
