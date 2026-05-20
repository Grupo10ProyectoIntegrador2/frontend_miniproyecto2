/**
 * RegistroGoogleUsernamePage – Ruta: /registro/google-username
 * Propósito: Completar registro iniciado con Google (username obligatorio).
 * Acciones: Confirmar username, guardar perfil y continuar.
 * Datos: Nombre, avatar, correo traídos de Google; campo username libre.
 * Estados: Vacío (formulario con datos precargados) | Éxito (→ /dashboard) | Error (username no disponible, fallo de persistencia)
 * TODO Sprint 1: Leer datos de Google OAuth desde Firebase y guardar en Firestore
 */
import { Link } from 'react-router-dom'

export default function RegistroGoogleUsernamePage() {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-8">
      <section
        aria-labelledby="google-username-heading"
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h1 id="google-username-heading" className="text-2xl font-bold mb-2 text-center">
          Un último paso
        </h1>
        <p className="text-center mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Elige un nombre de usuario único para tu perfil.
        </p>

        {/* Datos precargados desde Google (placeholder) */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
          <div
            aria-hidden="true"
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            G
          </div>
          <div>
            <p className="font-semibold">Nombre desde Google</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>correo@gmail.com</p>
          </div>
        </div>

        <div role="status" aria-live="polite" id="google-username-error-msg" />

        <form aria-label="Formulario para elegir nombre de usuario" noValidate>
          <div className="mb-6">
            <label htmlFor="google-username-input" className="block text-sm font-medium mb-1">
              Nombre de usuario <span aria-hidden="true">*</span>
            </label>
            <input
              id="google-username-input"
              type="text"
              autoComplete="username"
              required
              aria-required="true"
              aria-describedby="google-username-hint"
              className="w-full p-3 rounded-lg"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="mi_nombre_unico"
            />
            <p id="google-username-hint" className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Solo letras, números y guiones bajos. Debe ser único en la plataforma.
            </p>
          </div>

          <button
            id="btn-google-username-submit"
            type="submit"
            className="w-full py-3 rounded-lg font-semibold"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            Confirmar y continuar
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          ¿Quieres usar otra cuenta?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--color-primary)' }}>Volver al login</Link>
        </p>
      </section>
    </main>
  )
}
