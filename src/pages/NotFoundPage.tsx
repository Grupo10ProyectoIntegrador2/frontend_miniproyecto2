/**
 * NotFoundPage – Ruta: /404 y catch-all (*)
 * Propósito: Manejar rutas inexistentes o enlaces rotos.
 * Acciones: Ir al dashboard, volver al login, reintentar.
 * Datos: Mensaje de ruta no encontrada.
 * Estados:
 *   Éxito → navegación recuperada
 *   Error → ruta inválida persistente
 */
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <p aria-hidden="true" className="text-8xl font-black mb-4" style={{ color: 'var(--color-primary)' }}>
        404
      </p>
      <h1 className="text-2xl font-bold mb-3">Página no encontrada</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        La ruta que buscas no existe o el enlace está roto.
      </p>
      <nav aria-label="Opciones de navegación" className="flex gap-4 flex-wrap justify-center">
        <Link
          to="/dashboard"
          id="btn-404-dashboard"
          className="px-6 py-3 rounded-lg font-semibold"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          Ir al Dashboard
        </Link>
        <Link
          to="/login"
          id="btn-404-login"
          className="px-6 py-3 rounded-lg font-semibold border"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          Volver al Login
        </Link>
      </nav>
    </main>
  )
}
