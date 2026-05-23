import { AuthProvider } from './contexts/AuthContext'
import AppRouter from './router/AppRouter'

export default function App() {
  return (
    <AuthProvider>
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <AppRouter />
    </AuthProvider>
  )
}
