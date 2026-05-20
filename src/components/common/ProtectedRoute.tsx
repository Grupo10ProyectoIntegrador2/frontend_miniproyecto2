// Placeholder: ProtectedRoute
// Sprint 1 conectará esto con Firebase Auth
// Por ahora deja pasar todas las rutas (acceso libre)

import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * ProtectedRoute – guarda las rutas privadas.
 * TODO Sprint 1: verificar usuario autenticado con Firebase Auth.
 * Si no autenticado → redirigir a /login.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // TODO: const { user } = useAuth()
  // if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
