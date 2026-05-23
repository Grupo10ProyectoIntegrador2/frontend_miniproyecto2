import { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { validateLoginForm } from '../utils/validators'
import type { LoginFormData, FieldErrors } from '../types/auth.types'
import FormField from '../components/auth/FormField'
import AuthDivider from '../components/auth/AuthDivider'
import GoogleButton from '../components/auth/GoogleButton'

const INITIAL_FORM: LoginFormData = {
  email: '',
  password: '',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle, pendingGoogleData } = useAuth()

  const [form, setForm] = useState<LoginFormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<FieldErrors<LoginFormData>>({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const updateField = useCallback((field: keyof LoginFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setGeneralError('')
  }, [])

  const handleBlur = useCallback(
    (field: keyof LoginFormData) => {
      const formErrors = validateLoginForm(form)
      if (formErrors[field]) {
        setErrors((prev) => ({ ...prev, [field]: formErrors[field] }))
      }
    },
    [form]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')

    const formErrors = validateLoginForm(form)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesion'
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setGeneralError('')
    try {
      await loginWithGoogle()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error con la autenticacion de Google'
      setGeneralError(message)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // Redirigir cuando pendingGoogleData cambie (nuevo usuario Google)
  useEffect(() => {
    if (pendingGoogleData) {
      navigate('/registro/google-username')
    }
  }, [pendingGoogleData, navigate])

  const getInputClass = (field: keyof LoginFormData) => {
    return errors[field] ? 'auth-input input-error' : 'auth-input'
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12"
    >
      <div className="auth-card animate-slide-up">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Iniciar sesion
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Ingresa a tu cuenta para continuar
          </p>
        </div>

        <GoogleButton onClick={handleGoogleLogin} loading={isGoogleLoading} disabled={isSubmitting}>
          Ingresar con Google
        </GoogleButton>

        <AuthDivider />

        {generalError && (
          <div className="error-alert animate-shake mb-4" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField
            label="Correo electronico"
            id="login-email"
            error={errors.email}
            hint="El correo con el que te registraste"
            required
          >
            <input
              id="login-email"
              type="email"
              className={getInputClass('email')}
              placeholder="tu@universidad.edu"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              disabled={isSubmitting}
              aria-describedby={errors.email ? 'login-email-error' : 'login-email-hint'}
            />
          </FormField>

          <FormField
            label="Contrasena"
            id="login-password"
            error={errors.password}
            required
          >
            <input
              id="login-password"
              type="password"
              className={getInputClass('password')}
              placeholder="Tu contrasena"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              disabled={isSubmitting}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-button mt-2"
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Ingresando...
              </>
            ) : (
              'Iniciar sesion'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          No tienes cuenta?{' '}
          <Link
            to="/registro"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Registrate aqui
          </Link>
        </p>
      </div>
    </main>
  )
}
