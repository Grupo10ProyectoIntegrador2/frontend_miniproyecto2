import { useState, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { checkUsernameAvailable } from '../services/auth.service'
import {
  validateRequired,
  validateEmail,
  validatePassword,
  validateUsername,
  validateConfirmPassword,
  validateRegisterForm,
} from '../utils/validators'
import type { RegisterFormData, FieldErrors } from '../types/auth.types'
import FormField from '../components/auth/FormField'
import AvatarSelector from '../components/auth/AvatarSelector'
import AuthDivider from '../components/auth/AuthDivider'
import GoogleButton from '../components/auth/GoogleButton'

const INITIAL_FORM: RegisterFormData = {
  nombres: '',
  apellidos: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  avatarUrl: '',
}

export default function RegistroPage() {
  const navigate = useNavigate()
  const { register, loginWithGoogle, pendingGoogleData } = useAuth()

  const [form, setForm] = useState<RegisterFormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<FieldErrors<RegisterFormData>>({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateField = useCallback((field: keyof RegisterFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Limpiar error del campo al escribir
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setGeneralError('')
  }, [])

  // Verificacion de username con debounce
  const checkUsername = useCallback((value: string) => {
    if (usernameTimerRef.current) {
      clearTimeout(usernameTimerRef.current)
    }

    const localError = validateUsername(value)
    if (localError) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(value)
        if (available) {
          setUsernameStatus('available')
          setErrors((prev) => {
            const next = { ...prev }
            delete next.username
            return next
          })
        } else {
          setUsernameStatus('taken')
          setErrors((prev) => ({
            ...prev,
            username: 'Este nombre de usuario ya esta en uso',
          }))
        }
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)
  }, [])

  const handleBlur = useCallback(
    (field: keyof RegisterFormData) => {
      let error: string | null = null
      const value = form[field]

      switch (field) {
        case 'nombres':
          error = validateRequired(value, 'El nombre')
          break
        case 'apellidos':
          error = validateRequired(value, 'El apellido')
          break
        case 'username':
          error = validateUsername(value)
          if (!error) checkUsername(value)
          break
        case 'email':
          error = validateEmail(value)
          break
        case 'password':
          error = validatePassword(value)
          break
        case 'confirmPassword':
          error = validateConfirmPassword(form.password, value)
          break
        default:
          break
      }

      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }))
      }
    },
    [form, checkUsername]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')

    const formErrors = validateRegisterForm(form)

    // Verificar username duplicado si no se verifico antes
    if (!formErrors.username && usernameStatus === 'taken') {
      formErrors.username = 'Este nombre de usuario ya esta en uso'
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    // Verificar disponibilidad de username si esta en estado idle
    if (usernameStatus !== 'available') {
      setUsernameStatus('checking')
      try {
        const available = await checkUsernameAvailable(form.username)
        if (!available) {
          setUsernameStatus('taken')
          setErrors((prev) => ({
            ...prev,
            username: 'Este nombre de usuario ya esta en uso',
          }))
          return
        }
        setUsernameStatus('available')
      } catch {
        setGeneralError('Error al verificar el nombre de usuario')
        return
      }
    }

    setIsSubmitting(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta'
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true)
    setGeneralError('')
    try {
      await loginWithGoogle()
      // Si es usuario nuevo, redirigir a completar perfil
      if (pendingGoogleData) {
        navigate('/registro/google-username')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error con la autenticacion de Google'
      setGeneralError(message)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // Despues de loginWithGoogle, el pendingGoogleData se actualiza asincrono,
  // verificar en un efecto no es necesario porque navigate ya se llama arriba

  const getInputClass = (field: keyof RegisterFormData) => {
    const base = 'auth-input'
    if (errors[field]) return `${base} input-error`
    if (field === 'username' && usernameStatus === 'available') return `${base} input-success`
    return base
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
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Registrate para unirte a las salas de estudio
          </p>
        </div>

        <GoogleButton onClick={handleGoogleSignup} loading={isGoogleLoading} disabled={isSubmitting} />

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
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Nombres"
              id="registro-nombres"
              error={errors.nombres}
              hint="Tu nombre de pila"
              required
            >
              <input
                id="registro-nombres"
                type="text"
                className={getInputClass('nombres')}
                placeholder="Ej: Carlos"
                value={form.nombres}
                onChange={(e) => updateField('nombres', e.target.value)}
                onBlur={() => handleBlur('nombres')}
                disabled={isSubmitting}
                aria-describedby={errors.nombres ? 'registro-nombres-error' : 'registro-nombres-hint'}
              />
            </FormField>

            <FormField
              label="Apellidos"
              id="registro-apellidos"
              error={errors.apellidos}
              hint="Tus apellidos"
              required
            >
              <input
                id="registro-apellidos"
                type="text"
                className={getInputClass('apellidos')}
                placeholder="Ej: Martinez"
                value={form.apellidos}
                onChange={(e) => updateField('apellidos', e.target.value)}
                onBlur={() => handleBlur('apellidos')}
                disabled={isSubmitting}
                aria-describedby={errors.apellidos ? 'registro-apellidos-error' : 'registro-apellidos-hint'}
              />
            </FormField>
          </div>

          <FormField
            label="Nombre de usuario"
            id="registro-username"
            error={errors.username}
            hint={
              usernameStatus === 'checking'
                ? 'Verificando disponibilidad...'
                : usernameStatus === 'available'
                  ? 'Nombre de usuario disponible'
                  : '3-20 caracteres, letras, numeros y guiones bajos'
            }
            required
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">@</span>
              <input
                id="registro-username"
                type="text"
                className={`${getInputClass('username')} pl-7`}
                placeholder="mi_usuario"
                value={form.username}
                onChange={(e) => {
                  updateField('username', e.target.value)
                  if (e.target.value.length >= 3) {
                    checkUsername(e.target.value)
                  } else {
                    setUsernameStatus('idle')
                  }
                }}
                onBlur={() => handleBlur('username')}
                disabled={isSubmitting}
                aria-describedby={errors.username ? 'registro-username-error' : 'registro-username-hint'}
              />
              {usernameStatus === 'checking' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '1.5px' }} />
                </span>
              )}
              {usernameStatus === 'available' && !errors.username && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-success)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>
          </FormField>

          <AvatarSelector
            selected={form.avatarUrl}
            onSelect={(id) => updateField('avatarUrl', id)}
            error={errors.avatarUrl}
          />

          <FormField
            label="Correo institucional"
            id="registro-email"
            error={errors.email}
            hint="Usa tu correo universitario"
            required
          >
            <input
              id="registro-email"
              type="email"
              className={getInputClass('email')}
              placeholder="tu@universidad.edu"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              disabled={isSubmitting}
              aria-describedby={errors.email ? 'registro-email-error' : 'registro-email-hint'}
            />
          </FormField>

          <FormField
            label="Contrasena"
            id="registro-password"
            error={errors.password}
            hint="Minimo 8 caracteres, 1 mayuscula y 1 numero"
            required
          >
            <input
              id="registro-password"
              type="password"
              className={getInputClass('password')}
              placeholder="Tu contrasena"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              disabled={isSubmitting}
              aria-describedby={errors.password ? 'registro-password-error' : 'registro-password-hint'}
            />
          </FormField>

          <FormField
            label="Confirmar contrasena"
            id="registro-confirm-password"
            error={errors.confirmPassword}
            hint="Repite tu contrasena"
            required
          >
            <input
              id="registro-confirm-password"
              type="password"
              className={getInputClass('confirmPassword')}
              placeholder="Repite tu contrasena"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              disabled={isSubmitting}
              aria-describedby={errors.confirmPassword ? 'registro-confirm-password-error' : 'registro-confirm-password-hint'}
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting || usernameStatus === 'taken'}
            className="auth-button mt-2"
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Creando cuenta...
              </>
            ) : (
              'Registrarse'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Inicia sesion
          </Link>
        </p>
      </div>
    </main>
  )
}
