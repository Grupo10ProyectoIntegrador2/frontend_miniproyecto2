import { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { validateLoginForm } from '../utils/validators'
import type { LoginFormData, FieldErrors } from '../types/auth.types'
import FormField from '../components/auth/FormField'
import AuthDivider from '../components/auth/AuthDivider'
import GoogleButton from '../components/auth/GoogleButton'
import { Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react'

const INITIAL_FORM: LoginFormData = {
  email: '',
  password: '',
}

const ALLOWED_INLINE_ERRORS = [
  'El correo es obligatorio',
  'Ingresa un correo electrónico válido',
  'La contraseña es obligatoria',
]

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
      const error = formErrors[field]
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }))
        if (!ALLOWED_INLINE_ERRORS.includes(error)) {
          setGeneralError(error)
        }
      }
    },
    [form]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')

    const formErrors = validateLoginForm(form)
    
    let firstGeneralError = ''
    Object.entries(formErrors).forEach(([_, msg]) => {
      if (msg && !ALLOWED_INLINE_ERRORS.includes(msg) && !firstGeneralError) {
        firstGeneralError = msg
      }
    })

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      if (firstGeneralError) {
        setGeneralError(firstGeneralError)
      }
      return
    }

    setIsSubmitting(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      // Map any credentials error to the exact text in the mockup
      setGeneralError('Correo electrónico o contraseña incorrectos')
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
      const message = err instanceof Error ? err.message : 'Error con la autenticación de Google'
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
    const base = 'auth-input pl-10 relative w-full h-11 rounded-lg border bg-[var(--color-surface-2)] text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500'
    if (errors[field]) return `${base} border-red-400 focus:border-red-400 focus:ring-red-200`
    return `${base} border-[var(--color-border)] focus:border-violet-500 focus:ring-violet-200`
  }

  const getInlineError = (field: keyof LoginFormData) => {
    const error = errors[field]
    if (error && ALLOWED_INLINE_ERRORS.includes(error)) {
      return error
    }
    return undefined
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Header Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Salón de Estudio" className="h-8 w-8 object-contain" />
          <span className="font-semibold text-foreground tracking-tight text-base">Salón de Estudio</span>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Link>
      </header>

      {/* Main Login Container */}
      <main
        id="main-content"
        className="flex-grow flex items-center justify-center px-4 py-8"
      >
        <div className="w-full max-w-md bg-card rounded-3xl border border-border p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Bienvenido de vuelta a Salón de Estudio
            </p>
          </div>

          <GoogleButton onClick={handleGoogleLogin} loading={isGoogleLoading} disabled={isSubmitting}>
            Continuar con Google
          </GoogleButton>

          <AuthDivider />

          {generalError && (
            <div className="error-alert animate-shake mb-6 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/50 p-4 text-xs text-red-600" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
              <span className="font-medium">{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormField
              label="Correo electrónico"
              id="login-email"
              error={getInlineError('email')}
              hint="El correo con el que te registraste"
              required
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  className={getInputClass('email')}
                  placeholder="tu@universidad.edu"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={isSubmitting}
                  aria-describedby={getInlineError('email') ? 'login-email-error' : 'login-email-hint'}
                />
              </div>
            </FormField>

            <FormField
              label="Contraseña"
              id="login-password"
              error={getInlineError('password')}
              required
            >
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  className={getInputClass('password')}
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  disabled={isSubmitting}
                  aria-describedby={getInlineError('password') ? 'login-password-error' : undefined}
                />
              </div>
            </FormField>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-100 mt-4 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" />
                  Ingresando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground font-medium">
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              className="text-violet-600 hover:text-violet-700 transition-colors font-semibold"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
