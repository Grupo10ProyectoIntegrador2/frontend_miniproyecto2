/**
 * LoginPage – Ruta: /login
 * Propósito: Iniciar sesión y proteger acceso.
 * Acciones: Ingresar correo y contraseña | Continuar con Google | Ir a registro.
 * Estados: Vacío (formulario limpio) | Éxito (redirige a /dashboard) | Error (credenciales inválidas, error de red)
 * TODO Sprint 1: Integrar Firebase Authentication (email/password + Google OAuth)
 */
import { Link } from 'react-router-dom'

export default function LoginPage() {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center p-8">
      <section
        aria-labelledby="login-heading"
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h1 id="login-heading" className="text-2xl font-bold mb-6 text-center">
          Iniciar sesión
        </h1>

        {/* TODO Sprint 1: estado de error de autenticación */}
        <div role="status" aria-live="polite" id="login-error-msg" />

        <form aria-label="Formulario de inicio de sesión" noValidate>
          <div className="mb-4">
            <label htmlFor="login-email" className="block text-sm font-medium mb-1">
              Correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              className="w-full p-3 rounded-lg"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="usuario@correo.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="login-password" className="block text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              aria-required="true"
              className="w-full p-3 rounded-lg"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="••••••••"
            />
          </div>

          <button
            id="btn-login-email"
            type="submit"
            className="w-full py-3 rounded-lg font-semibold mb-3"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            Entrar
          </button>

          <button
            id="btn-login-google"
            type="button"
            className="w-full py-3 rounded-lg font-semibold border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Continuar con Google
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold" style={{ color: 'var(--color-primary)' }}>
            Regístrate
          </Link>
        </p>
      </section>
    </main>
  )
}
