/**
 * DashboardPage – Ruta: /dashboard (protegida)
 * Propósito: Centralizar acceso a salas y acciones principales.
 * Acciones: Ver mis salas, crear una nueva, unirme a sala por ID, abrir edición/eliminación si soy anfitrión.
 * Datos: Lista de salas creadas, nombre, ID, rol del usuario, botón de crear y unirse.
 * Estados:
 *   Vacío → "No tienes salas todavía" + CTA crear/unirse
 *   Éxito → lista visible de salas
 *   Error → no se pudieron cargar las salas
 * TODO Sprint 2: Cargar salas desde Firestore, conectar con WebSockets
 */
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  return (
    <main id="main-content" className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Mi Dashboard</h1>
        <nav aria-label="Acciones de sala" className="flex gap-3">
          <Link
            to="/salas/crear"
            id="btn-crear-sala"
            className="px-5 py-2 rounded-lg font-semibold"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            + Crear sala
          </Link>
          <Link
            to="/unirse"
            id="btn-unirse-sala"
            className="px-5 py-2 rounded-lg font-semibold border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Unirse por ID
          </Link>
        </nav>
      </header>

      {/* Estado vacío */}
      <section aria-label="Lista de salas" aria-live="polite">
        <div
          role="status"
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border)' }}
        >
          <p className="text-lg font-medium mb-2">No tienes salas todavía</p>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Crea una sala nueva o únete a una existente con su ID.
          </p>
          <Link
            to="/salas/crear"
            className="px-6 py-3 rounded-lg font-semibold"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            Crear mi primera sala
          </Link>
        </div>
      </section>
    </main>
  )
}
