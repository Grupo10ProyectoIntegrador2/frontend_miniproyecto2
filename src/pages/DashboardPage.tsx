import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <div
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            backgroundColor: getAvatarColor(user.avatarUrl),
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            className="h-10 w-10"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Bienvenido, {user.nombres}
        </h1>
        <p className="mt-1 text-[var(--color-text-muted)]">@{user.username}</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{user.email}</p>

        <div className="mt-6 rounded-lg bg-[var(--color-surface-2)] p-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">
            Datos del perfil
          </h2>
          <dl className="space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Nombre completo</dt>
              <dd className="text-[var(--color-text)]">{user.nombres} {user.apellidos}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Username</dt>
              <dd className="text-[var(--color-text)]">@{user.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-muted)]">Proveedor</dt>
              <dd className="text-[var(--color-text)] capitalize">{user.provider}</dd>
            </div>
          </dl>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          Cerrar sesion
        </button>
      </div>
    </main>
  )
}

function getAvatarColor(avatarUrl: string): string {
  const colorMap: Record<string, string> = {
    'avatar-1': '#6c63ff',
    'avatar-2': '#10b981',
    'avatar-3': '#f59e0b',
    'avatar-4': '#ef4444',
    'avatar-5': '#3b82f6',
    'avatar-6': '#ec4899',
    'avatar-7': '#8b5cf6',
    'avatar-8': '#14b8a6',
  }
  return colorMap[avatarUrl] || '#6c63ff'
}
