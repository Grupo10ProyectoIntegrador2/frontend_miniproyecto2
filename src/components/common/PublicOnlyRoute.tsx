import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { ReactNode } from 'react'

interface PublicOnlyRouteProps {
  children: ReactNode
}

/**
 * Protege rutas de auth (login, registro) para que usuarios
 * ya autenticados sean redirigidos al dashboard.
 */
export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-text-muted)] border-t-[var(--color-primary)]" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
