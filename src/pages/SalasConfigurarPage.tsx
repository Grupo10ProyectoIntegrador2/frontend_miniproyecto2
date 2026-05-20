/**
 * SalasConfigurarPage – Ruta: /salas/:roomId/configurar (protegida, solo anfitrión)
 * Propósito: Administrar una sala siendo anfitrión.
 * Acciones: Editar nombre o eliminar sala con confirmación.
 * Datos: Datos de la sala, rol del usuario, permisos de anfitrión.
 * Estados:
 *   Vacío → formulario con datos actuales
 *   Éxito → cambios reflejados en dashboard
 *   Error → sin permisos, fallo al actualizar o eliminar
 * TODO Sprint 3: Leer/escribir sala en Firestore, verificar rol de anfitrión
 */
import { useParams, Link } from 'react-router-dom'

export default function SalasConfigurarPage() {
  const { roomId } = useParams<{ roomId: string }>()

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-8">
      <section
        aria-labelledby="config-sala-heading"
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h1 id="config-sala-heading" className="text-2xl font-bold mb-2">Configurar sala</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          ID de sala: <code aria-label={`ID: ${roomId}`}>{roomId}</code>
        </p>

        <div role="status" aria-live="polite" id="config-sala-status-msg" />

        <form aria-label="Formulario de configuración de sala" noValidate>
          <div className="mb-6">
            <label htmlFor="config-sala-nombre" className="block text-sm font-medium mb-1">
              Nombre de la sala
            </label>
            <input
              id="config-sala-nombre"
              type="text"
              required
              aria-required="true"
              className="w-full p-3 rounded-lg"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="Nombre actual de la sala"
            />
          </div>

          <div className="flex gap-3 mb-6">
            <button id="btn-config-sala-guardar" type="submit"
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ background: 'var(--color-primary)', color: '#fff' }}>
              Guardar cambios
            </button>
            <Link to={`/salas/${roomId}`} id="btn-config-sala-cancelar"
              className="flex-1 py-3 rounded-lg font-semibold border text-center"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
              Cancelar
            </Link>
          </div>
        </form>

        <hr style={{ borderColor: 'var(--color-border)' }} className="mb-6" />

        <div>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-error)' }}>Zona peligrosa</p>
          <button
            id="btn-eliminar-sala"
            type="button"
            className="w-full py-3 rounded-lg font-semibold border"
            style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
            aria-label="Eliminar sala permanentemente"
          >
            Eliminar sala
          </button>
        </div>
      </section>
    </main>
  )
}
