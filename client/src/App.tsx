import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Ativos = lazy(() => import('./pages/Ativos'))
const Tickets = lazy(() => import('./pages/Tickets'))
const TicketDetalhes = lazy(() => import('./pages/TicketDetalhes'))
const Projetos = lazy(() => import('./pages/Projetos'))
const Licencas = lazy(() => import('./pages/Licencas'))
const Usuarios = lazy(() => import('./pages/Usuarios'))
const Setores = lazy(() => import('./pages/Setores'))
const Conhecimento = lazy(() => import('./pages/Conhecimento'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const Auditoria = lazy(() => import('./pages/Auditoria'))
const Inventario = lazy(() => import('./pages/Inventario'))
const Rede = lazy(() => import('./pages/Rede'))
const Maquinas = lazy(() => import('./pages/Maquinas'))
const Login = lazy(() => import('./pages/Login'))
const Registro = lazy(() => import('./pages/Registro'))
const LicencaSistema = lazy(() => import('./pages/LicencaSistema'))
const LicencaExpirada = lazy(() => import('./pages/LicencaExpirada'))

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
      <p className="mt-6 text-lg text-gray-600 font-medium">Carregando página...</p>
    </div>
  </div>
)

const SuspenseRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
)

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<SuspenseRoute><Login /></SuspenseRoute>} />
      <Route path="/registro" element={<SuspenseRoute><Registro /></SuspenseRoute>} />
      <Route path="/licenca-expirada" element={<SuspenseRoute><LicencaExpirada /></SuspenseRoute>} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<SuspenseRoute><Dashboard /></SuspenseRoute>} />
                <Route path="/ativos" element={<SuspenseRoute><Ativos /></SuspenseRoute>} />
                <Route path="/tickets" element={<SuspenseRoute><Tickets /></SuspenseRoute>} />
                <Route path="/tickets/:id" element={<SuspenseRoute><TicketDetalhes /></SuspenseRoute>} />
                <Route path="/projetos" element={<SuspenseRoute><Projetos /></SuspenseRoute>} />
                <Route path="/licencas" element={<SuspenseRoute><Licencas /></SuspenseRoute>} />
                <Route path="/usuarios" element={<SuspenseRoute><Usuarios /></SuspenseRoute>} />
                <Route path="/setores" element={<SuspenseRoute><Setores /></SuspenseRoute>} />
                <Route path="/conhecimento" element={<SuspenseRoute><Conhecimento /></SuspenseRoute>} />
                <Route path="/relatorios" element={<SuspenseRoute><Relatorios /></SuspenseRoute>} />
                <Route path="/auditoria" element={<SuspenseRoute><Auditoria /></SuspenseRoute>} />
                <Route path="/inventario" element={<SuspenseRoute><Inventario /></SuspenseRoute>} />
                <Route path="/rede" element={<SuspenseRoute><Rede /></SuspenseRoute>} />
                <Route path="/maquinas" element={<SuspenseRoute><Maquinas /></SuspenseRoute>} />
                <Route path="/licenca-sistema" element={<SuspenseRoute><LicencaSistema /></SuspenseRoute>} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
