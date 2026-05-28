import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Protege rutas privadas. Redirige a /login si el usuario
 * no esta autenticado. Muestra un loader mientras se verifica.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-text-muted)] border-t-[var(--color-primary)]" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
