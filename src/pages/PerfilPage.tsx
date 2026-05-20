/**
 * PerfilPage – Ruta: /perfil (protegida)
 * Propósito: Ver y editar información personal.
 * Acciones: Editar nombre, apellido, avatar, username, correo; guardar; eliminar cuenta.
 * Datos: Datos del usuario autenticado, validación de username y correo, acción destructiva.
 * Estados:
 *   Vacío → formulario cargado con datos actuales
 *   Éxito → perfil actualizado
 *   Error → colisión de username/correo, error al guardar
 *   Crítico → modal de eliminar cuenta
 * TODO Sprint 2: Leer/escribir perfil en Firestore, manejo de eliminación de cuenta Firebase
 */

export default function PerfilPage() {
  return (
    <main id="main-content" className="min-h-screen p-8 flex flex-col items-center">
      <section
        aria-labelledby="perfil-heading"
        className="w-full max-w-lg p-8 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h1 id="perfil-heading" className="text-2xl font-bold mb-6">Mi perfil</h1>

        <div role="status" aria-live="polite" id="perfil-status-msg" />

        <form aria-label="Formulario de edición de perfil" noValidate>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="perfil-nombre" className="block text-sm font-medium mb-1">Nombre</label>
              <input id="perfil-nombre" type="text" autoComplete="given-name" required aria-required="true"
                className="w-full p-3 rounded-lg"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <div>
              <label htmlFor="perfil-apellido" className="block text-sm font-medium mb-1">Apellido</label>
              <input id="perfil-apellido" type="text" autoComplete="family-name" required aria-required="true"
                className="w-full p-3 rounded-lg"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="perfil-username" className="block text-sm font-medium mb-1">Nombre de usuario</label>
            <input id="perfil-username" type="text" autoComplete="username" required aria-required="true"
              className="w-full p-3 rounded-lg"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
          </div>

          <div className="mb-6">
            <label htmlFor="perfil-email" className="block text-sm font-medium mb-1">Correo electrónico</label>
            <input id="perfil-email" type="email" autoComplete="email" required aria-required="true"
              className="w-full p-3 rounded-lg"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
          </div>

          <button id="btn-perfil-guardar" type="submit" className="w-full py-3 rounded-lg font-semibold mb-3"
            style={{ background: 'var(--color-primary)', color: '#fff' }}>
            Guardar cambios
          </button>
        </form>

        <hr style={{ borderColor: 'var(--color-border)' }} className="my-6" />

        {/* Zona destructiva */}
        <div>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-error)' }}>Zona peligrosa</p>
          <button
            id="btn-eliminar-cuenta"
            type="button"
            className="w-full py-3 rounded-lg font-semibold border"
            style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
            aria-label="Eliminar mi cuenta permanentemente"
          >
            Eliminar cuenta
          </button>
        </div>
      </section>
    </main>
  )
}
