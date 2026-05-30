import { useState, useCallback, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
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
import { User, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react'

const INITIAL_FORM: RegisterFormData = {
  nombres: '',
  apellidos: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  avatarUrl: '',
}

const ALLOWED_INLINE_ERRORS = [
  'El nombre es obligatorio',
  'El apellido es obligatorio',
  'El nombre de usuario es obligatorio',
  'El correo es obligatorio',
  'La contraseña es obligatoria',
  'Debes confirmar tu contraseña',
  'Este nombre de usuario ya esta en uso',
  'Este nombre de usuario ya está en uso',
  'Las contraseñas no coinciden',
]

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
        // Si el error no esta permitido mostrarse inline, se muestra como error general
        if (!ALLOWED_INLINE_ERRORS.includes(error)) {
          setGeneralError(error)
        }
      }
    },
    [form, checkUsername]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')

    const formErrors = validateRegisterForm(form)

    // Verificar username duplicado si no se verifco antes
    if (!formErrors.username && usernameStatus === 'taken') {
      formErrors.username = 'Este nombre de usuario ya esta en uso'
    }

    // Si hay algun error que no coincide con los indicados para mostrar en campos,
    // mostrar como error tipo general
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error con la autenticacion de Google'
      setGeneralError(message)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // Redirigir cuando el contexto actualice pendingGoogleData despues del login con Google
  useEffect(() => {
    if (pendingGoogleData) {
      navigate('/registro/google-username')
    }
  }, [pendingGoogleData, navigate])

  const getInputClass = (field: keyof RegisterFormData) => {
    const base = 'auth-input pl-10 relative w-full h-11 rounded-lg border bg-[var(--color-surface-2)] text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500'
    if (errors[field]) return `${base} border-red-400 focus:border-red-400 focus:ring-red-200`
    if (field === 'username' && usernameStatus === 'available') return `${base} border-emerald-400 focus:border-emerald-400 focus:ring-emerald-200`
    return `${base} border-[var(--color-border)] focus:border-violet-500 focus:ring-violet-200`
  }

  // Determina si el error especifico debe mostrarse de manera inline
  const getInlineError = (field: keyof RegisterFormData) => {
    const error = errors[field]
    if (error && ALLOWED_INLINE_ERRORS.includes(error)) {
      return error
    }
    return undefined
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Top Header Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Salón de Estudio" className="h-8 w-8 object-contain" />
          <span className="font-semibold text-slate-800 tracking-tight text-base">Salón de Estudio</span>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Link>
      </header>

      {/* Main Registration Container */}
      <main
        id="main-content"
        className="flex-grow flex items-center justify-center px-4 py-8"
      >
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Crear cuenta
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Regístrate para unirte a las salas de estudio
            </p>
          </div>

          <GoogleButton onClick={handleGoogleSignup} loading={isGoogleLoading} disabled={isSubmitting} />

          <AuthDivider />

          {generalError && (
            <div className="error-alert animate-shake mb-6 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/50 p-4 text-xs text-red-600" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
              <span className="font-medium">{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Nombres"
                id="registro-nombres"
                error={getInlineError('nombres')}
                hint="Tu nombre de pila"
                required
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="registro-nombres"
                    type="text"
                    className={getInputClass('nombres')}
                    placeholder="Ej: Carlos"
                    value={form.nombres}
                    onChange={(e) => updateField('nombres', e.target.value)}
                    onBlur={() => handleBlur('nombres')}
                    disabled={isSubmitting}
                    aria-describedby={getInlineError('nombres') ? 'registro-nombres-error' : 'registro-nombres-hint'}
                  />
                </div>
              </FormField>

              <FormField
                label="Apellidos"
                id="registro-apellidos"
                error={getInlineError('apellidos')}
                hint="Tus apellidos"
                required
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="registro-apellidos"
                    type="text"
                    className={getInputClass('apellidos')}
                    placeholder="Ej: Martínez"
                    value={form.apellidos}
                    onChange={(e) => updateField('apellidos', e.target.value)}
                    onBlur={() => handleBlur('apellidos')}
                    disabled={isSubmitting}
                    aria-describedby={getInlineError('apellidos') ? 'registro-apellidos-error' : 'registro-apellidos-hint'}
                  />
                </div>
              </FormField>
            </div>

            <FormField
              label="Nombre de usuario"
              id="registro-username"
              error={getInlineError('username')}
              hint={
                usernameStatus === 'checking'
                  ? 'Verificando disponibilidad...'
                  : usernameStatus === 'available'
                    ? 'Nombre de usuario disponible'
                    : '3-20 caracteres, letras, números y guiones bajos'
              }
              required
            >
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">@</span>
                <input
                  id="registro-username"
                  type="text"
                  className={getInputClass('username')}
                  placeholder="@mi.usuario"
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
                  aria-describedby={getInlineError('username') ? 'registro-username-error' : 'registro-username-hint'}
                />
                {usernameStatus === 'checking' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '1.5px' }} />
                  </span>
                )}
                {usernameStatus === 'available' && !getInlineError('username') && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
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
              error={getInlineError('avatarUrl')}
            />

            <FormField
              label="Correo institucional"
              id="registro-email"
              error={getInlineError('email')}
              hint="Usa tu correo universitario"
              required
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="registro-email"
                  type="email"
                  className={getInputClass('email')}
                  placeholder="tu@universidad.edu"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={isSubmitting}
                  aria-describedby={getInlineError('email') ? 'registro-email-error' : 'registro-email-hint'}
                />
              </div>
            </FormField>

            <FormField
              label="Contraseña"
              id="registro-password"
              error={getInlineError('password')}
              hint="Mínimo 8 caracteres, 1 mayúscula y 1 número"
              required
            >
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="registro-password"
                  type="password"
                  className={getInputClass('password')}
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  disabled={isSubmitting}
                  aria-describedby={getInlineError('password') ? 'registro-password-error' : 'registro-password-hint'}
                />
              </div>
            </FormField>

            <FormField
              label="Confirmar contraseña"
              id="registro-confirm-password"
              error={getInlineError('confirmPassword')}
              hint="Repite tu contraseña"
              required
            >
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="registro-confirm-password"
                  type="password"
                  className={getInputClass('confirmPassword')}
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  disabled={isSubmitting}
                  aria-describedby={getInlineError('confirmPassword') ? 'registro-confirm-password-error' : 'registro-confirm-password-hint'}
                />
              </div>
            </FormField>

            <button
              type="submit"
              disabled={isSubmitting || usernameStatus === 'taken'}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-100 mt-4 cursor-pointer"
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

          <p className="mt-8 text-center text-xs text-slate-400 font-medium">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="text-violet-600 hover:text-violet-700 transition-colors font-semibold"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
