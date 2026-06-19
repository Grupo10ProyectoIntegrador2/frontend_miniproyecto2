import { useAuth } from '../contexts/useAuth'
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { getRoomInitials } from '../lib/room-utils'
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
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const ownRooms = useMemo(() => allRooms.filter((r) => r.createdBy === user?.uid), [allRooms, user])
  const externalRooms = useMemo(() => allRooms.filter((r) => r.createdBy !== user?.uid), [allRooms, user])

  const loadRooms = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const joined = await getJoinedRooms()
      setAllRooms(joined)
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

  const hasRooms = allRooms.length > 0

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
            <button
              type="button"
              onClick={() => navigate('/salas/crear')}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-100 dark:shadow-none bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Crear Sala
            </button>
            <button
              type="button"
              onClick={() => navigate('/unirse')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 active:scale-[0.98] cursor-pointer"
            >
              Unirme a una Sala
            </button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <section className="space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Mis Salas
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {ownRooms.length} {ownRooms.length === 1 ? 'sala creada' : 'salas creadas'} · Eres administrador
                </p>
              </div>

              {ownRooms.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {ownRooms.map((room) => (
                    <article
                      key={room.id}
                      className={`flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${ownRooms.length === 1 ? 'sm:col-span-2' : ''}`}
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
                          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 break-all select-all">
                            <span>ID </span>
                            <span className="font-mono">{room.id}</span>
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Sala de estudio privada con acceso rápido y administración completa.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                          Administrador
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Activa
                        </span>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/salas/${room.id}/chat`, { state: { room } })}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-colors cursor-pointer"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                          Entrar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyId(room.id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 active:scale-[0.98] cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                          {copiedId === room.id ? 'Copiado' : 'Copiar ID'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
                  <Plus className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No has creado ninguna sala</p>
                  <button
                    type="button"
                    onClick={() => navigate('/salas/crear')}
                    className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                  >
                    Crear mi primera sala →
                  </button>
                </div>
              )}
            </section>

            <section className="space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Salas Externas
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {externalRooms.length} {externalRooms.length === 1 ? 'sala' : 'salas'} · Eres participante
                </p>
              </div>

              {externalRooms.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
                  {externalRooms.map((room) => (
                    <article
                      key={room.id}
                      className={`flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${externalRooms.length === 1 ? 'sm:col-span-2' : ''}`}
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
                          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 break-all select-all">
                            <span>ID </span>
                            <span className="font-mono">{room.id}</span>
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Sala de estudio a la que te has unido.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                          Participante
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Activa
                        </span>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/salas/${room.id}/chat`, { state: { room } })}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-colors cursor-pointer"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                          Entrar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyId(room.id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 active:scale-[0.98] cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                          {copiedId === room.id ? 'Copiado' : 'Copiar ID'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
                  <Key className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No te has unido a ninguna sala</p>
                  <button
                    type="button"
                    onClick={() => navigate('/unirse')}
                    className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                  >
                    Unirme a una sala →
                  </button>
                </div>
              )}
            </section>
          </div>
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
              <button
                type="button"
                onClick={() => navigate('/salas/crear')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 px-5 py-2.5 rounded-xl shadow-md font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                <Plus className="mr-2 h-5 w-5" /> 
                
                Crear mi primera sala
              </button>
              <button
                type="button"
                onClick={() => navigate('/unirse')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 px-5 py-2.5 rounded-xl shadow-sm font-medium transition-all active:scale-[0.98] cursor-pointer"
              >
                <Key className="mr-2 h-5 w-5" /> 
                Tengo un código
              </button>
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
