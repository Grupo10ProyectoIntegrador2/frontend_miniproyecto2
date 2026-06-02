import { useAuth } from '../contexts/useAuth'
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import {
  Users,
  Key,
  Video,
  MessageSquare,
  BookOpen,
  Plus,
  ArrowUpRight,
  Copy,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import DashboardHeader from '../components/DashboardHeader'
import Button from '../components/ui/Button'
import { getJoinedRooms } from '../services/rooms.service'
import { formatRoomId, getRoomInitials } from '../lib/room-utils'
import type { Room } from '../types/room.types'

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6']

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadRooms = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const joined = await getJoinedRooms()
      setRooms(joined.filter((room) => room.createdBy === user.uid))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar tus salas.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleCopyId = async (roomId: string) => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopiedId(roomId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setCopiedId(null)
    }
  }

  if (!user) return null

  const hasRooms = rooms.length > 0

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30 dark:bg-slate-950 transition-colors duration-200">
      <DashboardHeader onLogout={handleLogout} />

      <main id="main-content" className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 mt-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Bienvenido, {user.firstName}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
              {hasRooms
                ? 'Gestiona tus salas activas y entra a cualquiera en un clic'
                : 'Gestiona tus salas de estudio colaborativas'}
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-sm rounded-lg"
              onClick={() => navigate('/salas/crear')}
            >
              <Plus className="mr-2 h-4 w-4" /> Crear Sala
            </Button>
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 rounded-lg shadow-sm"
              onClick={() => navigate('/unirse')}
            >
              Unirme a una Sala
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Cargando tus salas...
          </div>
        )}

        {!loading && error && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/70 p-4 text-red-700 dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium">{error}</p>
              <button
                type="button"
                onClick={loadRooms}
                className="mt-2 text-sm font-semibold underline cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!loading && !error && hasRooms && (
          <section className="mb-16 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {rooms.length} {rooms.length === 1 ? 'sala lista' : 'salas listas'} para usar
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Entra a tu sala o comparte la ID para invitar a otros integrantes.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => (
                <article
                  key={room.id}
                  className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: getAvatarColor(room.name) }}
                    >
                      {getRoomInitials(room.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">
                        {room.name}
                      </h2>
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        ID {formatRoomId(room.id)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Sala de estudio privada con acceso rápido y administración completa.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Administrador
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Activa
                    </span>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button
                      className="flex-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => navigate(`/salas/${room.id}`, { state: { room } })}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Entrar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 dark:text-slate-200"
                      onClick={() => handleCopyId(room.id)}
                    >
                      <Copy className="h-4 w-4" />
                      {copiedId === room.id ? 'Copiado' : 'Copiar ID'}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!loading && !error && !hasRooms && (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-200 mb-8">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              No tienes salas todavía
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
              Crea tu primera sala de estudio o únete a una existente usando un código de acceso
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 px-8 py-6 rounded-xl shadow-md"
                onClick={() => navigate('/salas/crear')}
              >
                <Plus className="mr-2 h-5 w-5" /> Crear mi primera sala
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 px-8 py-6 rounded-xl shadow-sm"
                onClick={() => navigate('/unirse')}
              >
                <Key className="mr-2 h-5 w-5" /> Tengo un código
              </Button>
            </div>
          </div>
        )}

        <div className="mt-24 pt-10 border-t border-slate-100 dark:border-slate-800">
          <p className="text-center text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-8">
            ¿Qué puedes hacer en Salón de Estudio?
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 mb-4">
                <Video className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Videoconferencia</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Conecta en tiempo real con tus compañeros usando video y audio
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 mb-4">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Chat Colaborativo</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Comparte ideas, recursos y dudas con todos los participantes
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500 mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Salas Privadas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Crea salas con código de acceso para estudiar con tu grupo
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
