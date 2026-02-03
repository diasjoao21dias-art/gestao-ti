import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)

// Service Worker desativado durante desenvolvimento para evitar problemas de cache
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('Service Worker registrado com sucesso:', registration)
//       })
//       .catch((error) => {
//         console.log('Erro ao registrar Service Worker:', error)
//       })
//   })
// }
