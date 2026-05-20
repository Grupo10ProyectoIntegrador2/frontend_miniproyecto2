/**
 * UnirsePage – Ruta: /unirse (protegida)
 * Propósito: Unirse rápidamente a una sala por ID.
 * Acciones: Ingresar ID de sala, validar, entrar.
 * Datos: Campo Room ID, validación de existencia, acceso a sala.
 * Estados:
 *   Vacío → input y ayuda breve
 *   Éxito → redirige a /salas/:roomId
 *   Error → ID inexistente o formato inválido
 * TODO Sprint 3: Verificar existencia de sala en Firestore y redirigir
 */
import { Link } from 'react-router-dom'

export default function UnirsePage() {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-8">
      <section
        aria-labelledby="unirse-heading"
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h1 id="unirse-heading" className="text-2xl font-bold mb-2">Unirse a una sala</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Ingresa el ID de la sala para unirte como invitado.
        </p>

        <div role="status" aria-live="polite" id="unirse-error-msg" />

        <form aria-label="Formulario para unirse a sala" noValidate>
          <div className="mb-6">
            <label htmlFor="unirse-room-id" className="block text-sm font-medium mb-1">
              ID de sala <span aria-hidden="true">*</span>
            </label>
            <input
              id="unirse-room-id"
              type="text"
              required
              aria-required="true"
              aria-describedby="unirse-room-id-hint"
              className="w-full p-3 rounded-lg font-mono"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="Ej. abc123xyz"
            />
            <p id="unirse-room-id-hint" className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              El anfitrión de la sala debe haberte compartido este ID.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              id="btn-unirse-submit"
              type="submit"
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Entrar a la sala
            </button>
            <Link
              to="/dashboard"
              id="btn-unirse-cancelar"
              className="flex-1 py-3 rounded-lg font-semibold border text-center"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}
