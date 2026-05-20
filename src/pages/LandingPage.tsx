/**
 * LandingPage – Ruta: /
 * Propósito: Mostrar bienvenida y acceso a autenticación.
 * Estados: Vacío (landing simple con CTA) | Éxito (navegación a auth) | Error (CTA deshabilitado)
 */
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
        Salón de Estudio Colaborativo
      </h1>
      <p className="text-lg mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Estudia en tiempo real con tu equipo. Chat, video y pizarra en un solo lugar.
      </p>
      <nav aria-label="Acciones principales" className="flex gap-4 flex-wrap justify-center">
        <Link
          to="/login"
          id="cta-login"
          className="px-6 py-3 rounded-lg font-semibold transition-all"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          Iniciar sesión
        </Link>
        <Link
          to="/registro"
          id="cta-registro"
          className="px-6 py-3 rounded-lg font-semibold border transition-all"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          Crear cuenta
        </Link>
      </nav>
    </main>
  )
}
