import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User, Moon, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'

interface DashboardHeaderProps {
  onLogout?: () => void;
  fullWidth?: boolean;
}

export default function DashboardHeader({ onLogout, fullWidth = false }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

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

  const isUrl = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')
  }

  const handleLogout = async () => {
    setIsOpen(false)
    if (onLogout) {
      onLogout()
    } else {
      await logout()
      navigate('/login')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className={`mx-auto flex h-16 ${fullWidth ? 'max-w-full' : 'max-w-7xl'} items-center justify-between px-4 sm:px-6 lg:px-8`}>
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            Salón de Estudio
          </span>
        </Link>

        {/* Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100/80 dark:border-slate-700 shadow-xs cursor-pointer focus:outline-none"
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label="Menú de cuenta y configuraciones"
          >
            {/* Avatar Circle */}
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm shrink-0 overflow-hidden"
              style={{ backgroundColor: isUrl(user.avatarUrl) ? 'transparent' : getAvatarColor(user.avatarUrl) }}
            >
              {isUrl(user.avatarUrl) ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                user.firstName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Username / Email info */}
            <div className="hidden sm:flex flex-col text-left text-xs leading-tight">
              <span className="font-bold text-slate-900 dark:text-white">@{user.username}</span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">{user.email}</span>
            </div>

            {/* Chevron toggle */}
            <ChevronDown className={`h-4 w-4 text-slate-600 dark:text-slate-450 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-900 p-1.5 shadow-lg ring-1 ring-black/5 animate-fade-in z-50">
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/perfil?tab=perfil')
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <User className="h-4.5 w-4.5 text-slate-600 dark:text-slate-400" />
                Editar Perfil
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/perfil?tab=visualizacion')
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Moon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-400" />
                Visualización y accesibilidad
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50/50 transition-colors cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5 text-red-400" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
