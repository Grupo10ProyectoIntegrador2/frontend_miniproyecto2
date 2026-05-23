import { AuthProvider } from './contexts/AuthContext'
import AppRouter from './router/AppRouter'

/**
 * App -- punto de entrada de la aplicacion.
 * El skip-link es el primer elemento del DOM para cumplir WCAG 2.4.1 (Bypass Blocks).
 */
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
