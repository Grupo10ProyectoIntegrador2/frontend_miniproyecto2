import { use, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Loader2, AlertCircle, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import DashboardHeader from '../components/DashboardHeader'
import { useAuth } from '../contexts/useAuth'
import { auth } from '../lib/firebase'
import { socket } from '../lib/socket'
import { getRoomParticipants, joinRoom, updateRoom, deleteRoom } from '../services/rooms.service'
import type { Room, RoomParticipant } from '../types/room.types'

interface LocationState {
  room?: Room
  justCreated?: boolean
}

interface UserJoinedPayload {
  roomId: string
  participant?: RoomParticipant
  socketId?: string
}

function getParticipantFullName(participant: RoomParticipant): string {
  return `${participant.firstName} ${participant.lastName}`.trim() || participant.username || participant.uid
}

function getParticipantInitials(participant: RoomParticipant): string {
  const initials = `${participant.firstName?.trim().charAt(0) ?? ''}${participant.lastName?.trim().charAt(0) ?? ''}`.trim()
  return initials || participant.username.slice(0, 2).toUpperCase() || participant.uid.slice(0, 2).toUpperCase()
}

function sortParticipants(participants: RoomParticipant[]): RoomParticipant[] {
  return [...participants].sort((a, b) => {
    if (a.role !== b.role) {
      return a.role === 'Administrador' ? -1 : 1
    }

    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })
}

function upsertParticipant(participants: RoomParticipant[], participant: RoomParticipant): RoomParticipant[] {
  const next = participants.some((item) => item.uid === participant.uid)
    ? participants.map((item) => (item.uid === participant.uid ? participant : item))
    : [...participants, participant]

  return sortParticipants(next)
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
    const [participants, setParticipants] = useState<RoomParticipant[]>([])
    const [activityMessage, setActivityMessage] = useState('')
    const [editingName, setEditingName] = useState(false)
    const [newName, setNewName] = useState('')
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
      if (!roomId) return

      let cancelled = false

      async function loadRoom() {
        setLoading(true)
        setError('')

        try {
          const resolvedRoom = state?.room ?? await joinRoom(roomId!)
          if (!cancelled) {
            setRoom(resolvedRoom)
          }

          const roomParticipants = await getRoomParticipants(roomId!)
          if (!cancelled) {
            setParticipants(sortParticipants(roomParticipants))
          }
        } catch (err: unknown) {
          if (!cancelled) {
            const message = err instanceof Error ? err.message : 'No se pudo cargar la sala.'
            setError(message)
          }
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      }

      loadRoom()
      return () => {
        cancelled = true
      }
    }, [roomId, state?.room])

    useEffect(() => {
      if (!room || !user) return

      const currentParticipant: RoomParticipant = {
        uid: user.uid,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        createdAt: user.createdAt,
        joinedAt: new Date().toISOString(),
        role: room.createdBy === user.uid ? 'Administrador' : 'Participante',
      }

      const joinRoomSocket = () => {
        socket.emit('join-room', {
          roomId: room.id,
          participant: currentParticipant,
        })
      }

      const handleUserJoined = (payload: UserJoinedPayload) => {
        if (payload.roomId !== room.id || !payload.participant) return

        setParticipants((prev) => upsertParticipant(prev, payload.participant!))
        setActivityMessage(`${getParticipantFullName(payload.participant)} se unió a la sala`)
        window.setTimeout(() => setActivityMessage(''), 3000)
      }

      const connectWithAuth = async () => {
        const token = await auth.currentUser?.getIdToken()
        if (!token) return

        socket.auth = { token }

        if (socket.connected) {
          joinRoomSocket()
        } else {
          socket.connect()
          socket.once('connect', joinRoomSocket)
        }
      }

      void connectWithAuth()

      socket.on('user-joined', handleUserJoined)

      return () => {
        socket.off('user-joined', handleUserJoined)
        socket.off('connect', joinRoomSocket)
        socket.emit('leave-room', room.id)
        socket.disconnect()
      }
    }, [room, user])

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

    const handleEditName = async () => {
  if (!room || !newName.trim() || newName.trim() === room.name) return
  setSaving(true)
  try {
    const updated = await updateRoom(room.id, newName.trim())
    setRoom(updated)
    setEditingName(false)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo editar la sala.'
    setError(message)
  } finally {
    setSaving(false)
  }
}

    const handleDeleteRoom = async () => {
  if (!room) return
  const confirmed = window.confirm('¿Estás seguro de eliminar esta sala? Esta acción no se puede deshacer.')
  if (!confirmed) return
  setDeleting(true)
  try {
    await deleteRoom(room.id)
    socket.emit('leave-room', room.id)
    socket.disconnect()
    navigate('/dashboard', { replace: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo eliminar la sala.'
    setError(message)
    setDeleting(false)
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
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {error || 'Sala no encontrada.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Volver al dashboard
              </button>
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
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al dashboard
          </button>

          {justCreated && (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-950/30 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sala creada y abierta</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Ingresaste como {roleLabel} con un ID único y acceso inmediato.
                </p>
              </div>
              <span className="inline-flex max-w-full select-all break-all rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {room.id}
              </span>
            </div>
          )}

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{room.name}</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {roleLabel} · Sala activa
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
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98]"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copiado' : 'Copiar ID'}
                </button>
              </div>
            </div>
          </section>

          {isOwner && (
            <>
              <button
              type="button"
              onClick={() => { setNewName(room.name); setEditingName(true)}}
              className='inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              >
                <Pencil className='h-4 w-4' />
                Editar
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                disabled={deleting}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 active:scale-[0.98] disabled:opacity-50 dark:border-red-900/40 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </>
          )}

          {activityMessage && (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-3 text-sm font-medium text-blue-700 shadow-sm dark:border-blue-950/40 dark:bg-blue-950/20 dark:text-blue-300">
              {activityMessage}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Participantes</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isOwner
                  ? 'Tu rol es Administrador, por lo que puedes invitar, editar y cerrar la sala.'
                  : 'Estás conectado como participante de esta sala.'}
              </p>

              <ul className="mt-6 space-y-3">
                {participants.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Todavía no hay participantes cargados.
                  </li>
                ) : (
                  participants.map((participant) => {
                    const participantName = getParticipantFullName(participant)

                    return (
                      <li
                        key={participant.uid}
                        className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                            {getParticipantInitials(participant)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                              {participantName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {participant.username}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            participant.role === 'Administrador'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {participant.role}
                        </span>
                      </li>
                    )
                  })
                )}
              </ul>
            </section>

            <aside className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Código de acceso</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Comparte este ID para que otros se unan a la sala.
              </p>

              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">ID de la sala</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <p className="break-all select-all font-mono text-base font-semibold text-slate-900 dark:text-white">
                    {room.id}
                  </p>
                  {copied && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Copiado
                    </span>
                  )}
                </div>
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
          {editingName && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar nombre de la sala</h2>
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        maxLength={50}
        className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        autoFocus
      />
      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setEditingName(false)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleEditName}
          disabled={saving || newName.trim().length < 3}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  </div>
)}
        </main>
      </div>
    )
  }