/**
 * RegistroPage – Ruta: /registro
 * Propósito: Crear cuenta manual con identidad completa.
 * Acciones: Llenar nombre, apellidos, username, avatar, correo y contraseña; enviar formulario.
 * Estados: Vacío (formulario con ayuda) | Éxito (cuenta creada → /dashboard) | Error (username ocupado, correo inválido, fallo al guardar)
 * TODO Sprint 1: Integrar Firebase Authentication + escritura de perfil en Firestore
 */
import { Link } from 'react-router-dom'

export default function RegistroPage() {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-8">
      <section
        aria-labelledby="registro-heading"
        className="w-full max-w-lg p-8 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h1 id="registro-heading" className="text-2xl font-bold mb-6 text-center">
          Crear cuenta
        </h1>

        <div role="status" aria-live="polite" id="registro-error-msg" />

        <form aria-label="Formulario de registro" noValidate>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="reg-nombre" className="block text-sm font-medium mb-1">Nombre</label>
              <input id="reg-nombre" type="text" autoComplete="given-name" required aria-required="true"
                className="w-full p-3 rounded-lg"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                placeholder="Juan" />
            </div>
            <div>
              <label htmlFor="reg-apellido" className="block text-sm font-medium mb-1">Apellido</label>
              <input id="reg-apellido" type="text" autoComplete="family-name" required aria-required="true"
                className="w-full p-3 rounded-lg"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                placeholder="Pérez" />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="reg-username" className="block text-sm font-medium mb-1">
              Nombre de usuario <span aria-hidden="true">*</span>
            </label>
            <input id="reg-username" type="text" autoComplete="username" required aria-required="true"
              aria-describedby="reg-username-hint"
              className="w-full p-3 rounded-lg"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="juanperez123" />
            <p id="reg-username-hint" className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Solo letras, números y guiones bajos. Debe ser único.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="reg-email" className="block text-sm font-medium mb-1">Correo electrónico</label>
            <input id="reg-email" type="email" autoComplete="email" required aria-required="true"
              className="w-full p-3 rounded-lg"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="usuario@correo.com" />
          </div>

          <div className="mb-6">
            <label htmlFor="reg-password" className="block text-sm font-medium mb-1">Contraseña</label>
            <input id="reg-password" type="password" autoComplete="new-password" required aria-required="true"
              aria-describedby="reg-password-hint"
              className="w-full p-3 rounded-lg"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="••••••••" />
            <p id="reg-password-hint" className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Mínimo 8 caracteres.
            </p>
          </div>

          <button id="btn-registro-submit" type="submit" className="w-full py-3 rounded-lg font-semibold"
            style={{ background: 'var(--color-primary)', color: '#fff' }}>
            Crear cuenta
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--color-primary)' }}>Inicia sesión</Link>
        </p>
      </section>
    </main>
  )
}
