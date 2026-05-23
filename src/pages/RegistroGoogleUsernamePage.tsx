import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { checkUsernameAvailable } from '../services/auth.service'
import { validateUsername } from '../utils/validators'
import FormField from '../components/auth/FormField'

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
      setStatus('idle')
      return
    }

    setError('')
    setStatus('checking')
    timerRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(value)
        if (available) {
          setStatus('available')
          setError('')
        } else {
          setStatus('taken')
          setError('Este nombre de usuario ya esta en uso')
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
      return
    }

    if (status === 'taken') {
      setError('Este nombre de usuario ya esta en uso')
      return
    }

    // Verificar una ultima vez si no se ha confirmado
    if (status !== 'available') {
      setStatus('checking')
      try {
        const available = await checkUsernameAvailable(username)
        if (!available) {
          setStatus('taken')
          setError('Este nombre de usuario ya esta en uso')
          return
        }
      } catch {
        setGeneralError('Error de conexion al verificar el username')
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
    const base = 'auth-input'
    if (error) return `${base} input-error`
    if (status === 'available') return `${base} input-success`
    return base
  })()

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12"
    >
      <div className="auth-card animate-slide-up">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Completa tu perfil
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Un paso mas para empezar
          </p>
        </div>

        {/* Datos de Google como confirmacion */}
        <div className="flex items-center gap-4 rounded-lg bg-[var(--color-surface-2)] p-4 mb-6">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="h-6 w-6">
              <circle cx="12" cy="8" r="4" />
              <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)] truncate">
              {pendingGoogleData.displayName}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              {pendingGoogleData.email}
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-[rgba(16,185,129,0.15)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-success)]">
            Google
          </span>
        </div>

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
            label="Elige tu nombre de usuario"
            id="google-username"
            error={error}
            hint={
              status === 'checking'
                ? 'Verificando disponibilidad...'
                : status === 'available'
                  ? 'Nombre de usuario disponible'
                  : '3-20 caracteres, letras, numeros y guiones bajos'
            }
            required
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">@</span>
              <input
                id="google-username"
                type="text"
                className={`${inputClass} pl-7`}
                placeholder="mi_usuario"
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
                  if (localError) setError(localError)
                }}
                disabled={isSubmitting}
                autoFocus
                aria-describedby={error ? 'google-username-error' : 'google-username-hint'}
              />
              {status === 'checking' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '1.5px' }} />
                </span>
              )}
              {status === 'available' && !error && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-success)]">
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
            className="auth-button mt-2"
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
          className="mt-4 w-full text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Cancelar y volver al registro
        </button>
      </div>
    </main>
  )
}
