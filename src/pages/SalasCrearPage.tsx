/**
 * SalasCrearPage – Ruta: /salas/crear (protegida)
 * Propósito: Crear una nueva sala de estudio.
 * Acciones: Escribir nombre de sala, confirmar creación, cancelar.
 * Datos: Nombre de sala, ID generado al crear, usuario creador.
 * Estados:
 *   Vacío → formulario simple
 *   Éxito → sala creada → redirigir a /salas/:roomId
 *   Error → nombre inválido o fallo al crear
 * TODO Sprint 2: Escribir sala en Firestore y redirigir con el ID generado
 */
import { Link } from 'react-router-dom'

export default function SalasCrearPage() {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-8">
      <section
        aria-labelledby="crear-sala-heading"
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h1 id="crear-sala-heading" className="text-2xl font-bold mb-6">Crear sala de estudio</h1>

        <div role="status" aria-live="polite" id="crear-sala-error-msg" />

        <form aria-label="Formulario para crear sala" noValidate>
          <div className="mb-6">
            <label htmlFor="sala-nombre" className="block text-sm font-medium mb-1">
              Nombre de la sala <span aria-hidden="true">*</span>
            </label>
            <input
              id="sala-nombre"
              type="text"
              required
              aria-required="true"
              aria-describedby="sala-nombre-hint"
              className="w-full p-3 rounded-lg"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="Ej. Estudio Cálculo - Grupo A"
            />
            <p id="sala-nombre-hint" className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Máximo 60 caracteres. El ID de sala se generará automáticamente.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              id="btn-crear-sala-submit"
              type="submit"
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Crear sala
            </button>
            <Link
              to="/dashboard"
              id="btn-crear-sala-cancelar"
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
