import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowUpRight,
  Copy,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import DashboardHeader from '../components/DashboardHeader'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/useAuth'
import { joinRoom } from '../services/rooms.service'
import { formatRoomId } from '../lib/room-utils'
import type { Room } from '../types/room.types'

interface LocationState {
  room?: Room
  justCreated?: boolean
}

export default function SalaRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const state = location.state as LocationState | null

  const [room, setRoom] = useState<Room | null>(state?.room ?? null)
  const [justCreated] = useState(Boolean(state?.justCreated))
  const [loading, setLoading] = useState(!state?.room)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!roomId || state?.room) return

    let cancelled = false

    async function loadRoom() {
      setLoading(true)
      setError('')
      try {
        const joinedRoom = await joinRoom(roomId!)
        if (!cancelled) setRoom(joinedRoom)
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'No se pudo cargar la sala.'
          setError(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadRoom()
    return () => {
      cancelled = true
    }
  }, [roomId, state?.room])

  const handleCopyId = async () => {
    if (!room) return
    try {
      await navigator.clipboard.writeText(room.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/30 dark:bg-slate-950">
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center text-slate-500 dark:text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Abriendo sala...
        </main>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/30 dark:bg-slate-950">
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm dark:border-red-950/40 dark:bg-slate-900">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              No se pudo abrir la sala
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error || 'Sala no encontrada.'}</p>
            <Button className="mt-6 rounded-xl" onClick={() => navigate('/dashboard')}>
              Volver al panel
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const isOwner = room.createdBy === user.uid
  const roleLabel = isOwner ? 'Administrador' : 'Participante'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30 dark:bg-slate-950">
      <DashboardHeader />

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {justCreated && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-950/30 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sala creada y abierta</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Ingresaste como {roleLabel} con un ID único y acceso inmediato.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              ID {formatRoomId(room.id)}
            </span>
          </div>
        )}

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{room.name}</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                ID {formatRoomId(room.id)} · {roleLabel} · Sala activa
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {isOwner && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    Propietario
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Privada
                </span>
                <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-pink-600 dark:bg-pink-950/30 dark:text-pink-400">
                  Activa ahora
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl border-slate-200 dark:border-slate-700 dark:text-slate-200"
                onClick={handleCopyId}
              >
                <ArrowUpRight className="h-4 w-4" />
                Invitar
              </Button>
              <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={handleCopyId}>
                <Copy className="h-4 w-4" />
                {copied ? 'Copiado' : 'Copiar código'}
              </Button>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Participantes</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isOwner
                ? 'Tu rol es Administrador, por lo que puedes invitar, editar y cerrar la sala.'
                : 'Estás conectado como participante de esta sala.'}
            </p>

            <ul className="mt-6 space-y-3">
              <li className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {user.firstName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
                  </div>
                </div>
                {isOwner && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    Propietario
                  </span>
                )}
              </li>
            </ul>
          </section>

          <aside className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Vista de sala</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Una vez creada, esta es la pantalla a la que el anfitrión llega como administrador.
            </p>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">ID de la sala</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xl font-extrabold tracking-wide text-slate-900 dark:text-white">
                  {formatRoomId(room.id)}
                </p>
                {copied && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Copiado
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Comparte este código para que otros se unan a la sala.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Panel rápido</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Compartir código con el grupo</li>
                <li>• Gestionar permisos de la sala</li>
                <li>• Acceder al chat colaborativo</li>
                <li>• Revisar participantes conectados</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
