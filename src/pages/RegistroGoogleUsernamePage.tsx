import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { checkUsernameAvailable } from '../services/auth.service'
import { validateUsername } from '../utils/validators'
import FormField from '../components/auth/FormField'
import { AlertCircle, User } from 'lucide-react'

const ALLOWED_INLINE_ERRORS = [
  'El nombre de usuario es obligatorio',
  'Este nombre de usuario ya esta en uso',
  'Este nombre de usuario ya está en uso',
]

export default function RegistroGoogleUsernamePage() {
  const navigate = useNavigate()
  const { pendingGoogleData, completeProfile, clearPendingGoogle } = useAuth()

  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Si no hay datos de Google pendientes, redirigir al registro normal
  useEffect(() => {
    if (!pendingGoogleData) {
      navigate('/registro')
    }
  }, [pendingGoogleData, navigate])

  const checkAvailability = useCallback((value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const localError = validateUsername(value)
    if (localError) {
      setError(localError)
      // Si el error no es inline permitido, lo mandamos a general
      if (!ALLOWED_INLINE_ERRORS.includes(localError)) {
        setGeneralError(localError)
      } else {
        setGeneralError('')
      }
      setStatus('idle')
      return
    }

    setError('')
    setGeneralError('')
    setStatus('checking')
    timerRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(value)
        if (available) {
          setStatus('available')
          setError('')
        } else {
          setStatus('taken')
          setError('Este nombre de usuario ya está en uso')
        }
      } catch {
        setStatus('idle')
        setError('Error al verificar disponibilidad')
      }
    }, 400)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')

    const localError = validateUsername(username)
    if (localError) {
      setError(localError)
      if (!ALLOWED_INLINE_ERRORS.includes(localError)) {
        setGeneralError(localError)
      }
      return
    }

    if (status === 'taken' || error === 'Este nombre de usuario ya está en uso') {
      setError('Este nombre de usuario ya está en uso')
      return
    }

    // Verificar una última vez si no se ha verificado
    if (status !== 'available') {
      setStatus('checking')
      try {
        const available = await checkUsernameAvailable(username)
        if (!available) {
          setStatus('taken')
          setError('Este nombre de usuario ya está en uso')
          return
        }
      } catch {
        setGeneralError('Error de conexión al verificar el username')
        return
      }
    }

    setIsSubmitting(true)
    try {
      await completeProfile(username)
      navigate('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al completar el perfil'
      setGeneralError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    clearPendingGoogle()
    navigate('/registro')
  }

  if (!pendingGoogleData) return null

  const inputClass = (() => {
    const base = 'auth-input pl-9 relative w-full h-11 rounded-lg border bg-[var(--color-surface-2)] text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500'
    if (error) return `${base} border-red-400 focus:border-red-400 focus:ring-red-200`
    if (status === 'available') return `${base} border-emerald-400 focus:border-emerald-400 focus:ring-emerald-200`
    return `${base} border-[var(--color-border)] focus:border-violet-500 focus:ring-violet-200`
  })()

  // Determina si el error debe mostrarse inline
  const getInlineError = () => {
    if (error && ALLOWED_INLINE_ERRORS.includes(error)) {
      return error
    }
    return undefined
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Mini top logo navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-violet-600 text-white shadow-md shadow-violet-200">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z"/>
              <path d="M4.5 13.5V17.5L12 21.5L19.5 17.5V13.5L12 17.5L4.5 13.5Z"/>
            </svg>
          </div>
          <span className="font-semibold text-slate-800 tracking-tight text-base">Salón de Estudio</span>
        </div>
      </header>

      <main
        id="main-content"
        className="flex-grow flex items-center justify-center px-4 py-8"
      >
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Completa tu perfil
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Un paso más para empezar
            </p>
          </div>

          {/* Confirmación de Datos de Google (Tarjeta Premium) */}
          <div className="flex items-center gap-3.5 rounded-2xl bg-slate-50 border border-slate-100 p-4 mb-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm shadow-violet-200">
              <User className="h-5.5 w-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate uppercase tracking-tight">
                {pendingGoogleData.displayName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {pendingGoogleData.email}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
              Google
            </span>
          </div>

          {generalError && (
            <div className="error-alert animate-shake mb-6 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/50 p-4 text-xs text-red-600" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
              <span className="font-medium">{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <FormField
              label="Elige tu nombre de usuario"
              id="google-username"
              error={getInlineError()}
              hint={
                status === 'checking'
                  ? 'Verificando disponibilidad...'
                  : status === 'available'
                    ? 'Nombre de usuario disponible'
                    : '3-20 caracteres, letras, números y guiones bajos'
              }
              required
            >
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">@</span>
                <input
                  id="google-username"
                  type="text"
                  className={inputClass}
                  placeholder="@mi_usuario"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError('')
                    setGeneralError('')
                    if (e.target.value.length >= 3) {
                      checkAvailability(e.target.value)
                    } else {
                      setStatus('idle')
                    }
                  }}
                  onBlur={() => {
                    const localError = validateUsername(username)
                    if (localError) {
                      setError(localError)
                      if (!ALLOWED_INLINE_ERRORS.includes(localError)) {
                        setGeneralError(localError)
                      }
                    }
                  }}
                  disabled={isSubmitting}
                  autoFocus
                  aria-describedby={getInlineError() ? 'google-username-error' : 'google-username-hint'}
                />
                {status === 'checking' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '1.5px' }} />
                  </span>
                )}
                {status === 'available' && !error && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
            </FormField>

            <button
              type="submit"
              disabled={isSubmitting || status === 'taken' || !!error}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-100 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" />
                  Completando perfil...
                </>
              ) : (
                'Confirmar y continuar'
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={handleCancel}
            className="mt-6 w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            Cancelar y volver al registro
          </button>
        </div>
      </main>
    </div>
  )
}
