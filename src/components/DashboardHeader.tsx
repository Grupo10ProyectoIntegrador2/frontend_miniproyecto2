import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface DashboardHeaderProps {
  onLogout: () => void;
}

export default function DashboardHeader({ onLogout }: DashboardHeaderProps) {
  const { user } = useAuth()

  if (!user) return null

  // Utility to map avatar string to a color
  const getAvatarColor = (avatarUrl: string): string => {
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="Salón de Estudio" className="h-7 w-7 object-contain" />
          <span className="text-lg font-bold text-slate-900">
            Salón de Estudio
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-lg"
              style={{ backgroundColor: getAvatarColor(user.avatarUrl) }}
            >
              {user.nombres.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-sm">
              <span className="font-bold text-slate-900">{user.nombres}</span>
              <span className="text-slate-500 text-xs">@{user.username}</span>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="ml-2 flex items-center justify-center rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
