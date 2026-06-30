import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Send,
  Loader2,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Mic,
  Smile,
  Copy,
  Edit2,
  Check,
  Trash2,
  Play,
  Menu,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/useAuth'
import { auth } from '../lib/firebase'
import { socket } from '../lib/socket'
import { joinRoom, getRoomParticipants, updateRoom, deleteRoom } from '../services/rooms.service'
import DashboardHeader from '../components/DashboardHeader'
import type { Room, RoomParticipant } from '../types/room.types'
import type { RoomPresencePayload, VideoCallStatus } from '../types/videoCall.types'

/* ─────────────── Types ─────────────── */

interface ChatMessage {
  id: string
  roomId: string
  senderUid: string
  senderName: string
  senderUsername: string
  content: string
  createdAt: string
}

/* ─────────────── Helpers ─────────────── */

const AVATAR_COLORS = [
  '#4338ca',
  '#6d28d9',
  '#be185d',
  '#0f766e',
  '#b45309',
  '#047857',
  '#1d4ed8',
]

function avatarColor(uid: string): string {
  let hash = 0
  for (const c of uid) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateSep(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return `Hoy, ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
  }
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) {
    return `Ayer, ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
  }
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

/* ─────────────── Component ─────────────── */

export default function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [onlineParticipants, setOnlineParticipants] = useState<RoomParticipant[]>([])
  const [videoCallStatus, setVideoCallStatus] = useState<VideoCallStatus | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Room Management states
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Responsiveness states
  const [showMenu, setShowMenu] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const participantsRef = useRef<RoomParticipant[]>([])
  participantsRef.current = participants

  const handleCopyId = () => {
    if (!room) return
    navigator.clipboard.writeText(room.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isOwner = user && room && room.createdBy === user.uid
  const isVideoCallActive = Boolean(videoCallStatus?.active)
  const videoCallCount = videoCallStatus?.count ?? 0
  const onlineCount = onlineParticipants.length

  const upsertOnlineParticipant = (
    uid: string,
    participant?: RoomParticipant,
  ) => {
    if (!participant) return
    setOnlineParticipants((prev) => {
      const exists = prev.some((p) => p.uid === uid)
      if (exists) {
        return prev.map((p) => (p.uid === uid ? participant : p))
      }
      return [...prev, participant]
    })
  }

  const removeOnlineParticipant = (uid: string) => {
    setOnlineParticipants((prev) => prev.filter((p) => p.uid !== uid))
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

  /* ── Auto-scroll ── */
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /* ── Cargar sala y participantes ── */
  useEffect(() => {
    if (!roomId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const r = await joinRoom(roomId!)
        if (!cancelled) setRoom(r)
        const ps = await getRoomParticipants(roomId!)
        if (!cancelled) setParticipants(ps)
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : 'No se pudo cargar la sala.',
          )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [roomId])

  /* ── Conexión Socket ── */
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

    const joinRoomSocket = () =>
      socket.emit('join-room', { roomId: room.id, participant: currentParticipant })

    const handleChatHistory = (payload: {
      roomId: string
      messages: ChatMessage[]
    }) => {
      if (payload.roomId !== room.id) return
      setMessages(payload.messages)
    }

    const handleNewMessage = (message: ChatMessage) => {
      if (message.roomId !== room.id) return
      setMessages((prev) => [...prev, message])
    }

    const handleMessageError = (payload: { message: string }) => {
      console.error('[Chat]', payload.message)
    }

    const resolveParticipant = (uid: string, participant?: RoomParticipant) =>
      participant ?? participantsRef.current.find((p) => p.uid === uid)

    const handleUserJoined = (payload: {
      roomId: string
      participant?: RoomParticipant
      uid: string
    }) => {
      if (payload.roomId !== room.id) return
      const resolved = resolveParticipant(payload.uid, payload.participant)
      if (resolved) upsertOnlineParticipant(payload.uid, resolved)
    }

    const handleUserLeft = (payload: { uid: string }) => {
      removeOnlineParticipant(payload.uid)
    }

    const handleRoomPresence = (payload: RoomPresencePayload) => {
      if (payload.roomId !== room.id) return
      const others = payload.users
        .map((entry) => resolveParticipant(entry.uid, entry.participant))
        .filter((participant): participant is RoomParticipant => Boolean(participant))
      setOnlineParticipants([currentParticipant, ...others])
    }

    const handleVideoCallStatus = (payload: VideoCallStatus) => {
      if (payload.roomId !== room.id) return
      setVideoCallStatus(payload)
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
    socket.on('chat-history', handleChatHistory)
    socket.on('new-message', handleNewMessage)
    socket.on('message-error', handleMessageError)
    socket.on('user-joined', handleUserJoined)
    socket.on('user-left', handleUserLeft)
    socket.on('room-presence', handleRoomPresence)
    socket.on('video-call-status', handleVideoCallStatus)

    return () => {
      socket.off('chat-history', handleChatHistory)
      socket.off('new-message', handleNewMessage)
      socket.off('message-error', handleMessageError)
      socket.off('user-joined', handleUserJoined)
      socket.off('user-left', handleUserLeft)
      socket.off('room-presence', handleRoomPresence)
      socket.off('video-call-status', handleVideoCallStatus)
      socket.off('connect', joinRoomSocket)
      socket.emit('leave-room', room.id)
      socket.disconnect()
    }
  }, [room, user])

  /* ── Envío de mensaje ── */
  const handleSendMessage = async () => {
    const trimmed = newMessage.trim()
    if (!trimmed || !room || sending) return
    setSending(true)
    try {
      socket.emit('send-message', { roomId: room.id, content: trimmed })
      setNewMessage('')
      inputRef.current?.focus()
    } catch {
      // silently ignore
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSendMessage()
    }
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-600" />
        <span className="text-sm text-slate-600 dark:text-slate-400">Abriendo chat...</span>
      </div>
    )
  }

  /* ── Error state ── */
  if (error || !room) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-200">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          No se pudo abrir el chat
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{error || 'Sala no encontrada.'}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={15} />
          Volver al dashboard
        </button>
      </div>
    )
  }

  const userFullName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.username
    : ''

  /* ── Main render ── */
  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* ════════════════════ TOP HEADER ════════════════════ */}
      <DashboardHeader />

      {/* ════════════════════ CONTENT ════════════════════ */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop for Left Sidebar on Mobile */}
        {showMenu && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
            onClick={() => setShowMenu(false)}
          />
        )}

        {/* Backdrop for Right Sidebar on Mobile */}
        {showParticipants && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
            onClick={() => setShowParticipants(false)}
          />
        )}

        {/* ──────────── LEFT SIDEBAR ──────────── */}
        <aside className={`
          ${showMenu ? 'flex fixed inset-y-0 left-0 z-45 shadow-xl w-60' : 'hidden'} 
          md:flex md:relative md:w-52 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-200
        `}>
          {/* Volver al dashboard en la parte superior */}
          <div className="border-b border-slate-100 px-3 py-3 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ArrowLeft size={14} />
              Volver al dashboard
            </button>
            <button
              type="button"
              onClick={() => setShowMenu(false)}
              className="md:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X size={16} />
            </button>
          </div>

          {/* SECCIÓN UNIFICADA: SESIÓN ACTIVA / GESTIÓN DE SALA */}
          <div className="m-3 mb-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white/20 p-1.5">
                  <BookOpen size={14} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-tight">
                    {room.name}
                  </p>
                  <p className="text-[11px] text-indigo-200">Sesión Activa</p>
                </div>
              </div>
              {isOwner && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { setNewName(room.name); setEditingName(true); }}
                    className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    title="Editar nombre"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button 
                    onClick={handleDeleteRoom}
                    disabled={deleting}
                    className="rounded-lg p-1 text-white/70 hover:bg-red-500/30 hover:text-red-200 transition-colors disabled:opacity-50"
                    title="Eliminar sala"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium tracking-wider text-indigo-200">ID DE SALA</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-white">#{room.id.substring(0, 8).toUpperCase()}</span>
                  <button 
                    onClick={handleCopyId}
                    className="text-white/80 hover:text-white transition-colors"
                    title="Copiar ID completo"
                  >
                    {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1" />
        </aside>

        {/* ──────────── MAIN CHAT ──────────── */}
        <main className="flex flex-1 flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 p-4 gap-4 transition-colors duration-200">
          
          {/* Top Card: Start Video Call */}
          <div className="flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-6 py-6 shadow-sm min-h-[96px] transition-colors duration-200">
            <button
              type="button"
              onClick={() => navigate(`/salas/${roomId}/video`)}
              className="flex items-center gap-2 rounded-xl bg-[#0047E1] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 active:scale-[0.98]"
            >
              <Play size={16} className="fill-current" />
              Iniciar una videollamada
            </button>
          </div>

          {/* Chat Container Card */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm transition-colors duration-200">
            {/* Header inside chat container */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                {/* Mobile Left Sidebar Toggle */}
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  aria-label="Ver menú de sala"
                >
                  <Menu size={20} />
                </button>

                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50/80 dark:bg-blue-950/40">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-white leading-tight truncate">{room.name}</h2>
                  <p className="text-[11px] sm:text-[13px] text-slate-650 dark:text-slate-400 mt-0.5 truncate">{onlineCount} en vivo • {participants.length} total</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile Right Sidebar Toggle */}
                <button
                  type="button"
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  aria-label="Ver participantes"
                >
                  <Users size={20} />
                </button>
              </div>
            </div>

          {/* Messages list */}
          <div
            id="chat-messages-area"
            className="flex-1 overflow-y-auto px-5 py-4"
          >
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Aún no hay mensajes. ¡Sé el primero en escribir!
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {messages.map((msg, index) => {
                  const isOwn = msg.senderUid === user?.uid
                  const showDateSep =
                    index === 0 ||
                    !isSameDay(messages[index - 1].createdAt, msg.createdAt)
                  const prevMsg = index > 0 ? messages[index - 1] : null
                  const showSenderInfo =
                    !isOwn &&
                    (!prevMsg ||
                      prevMsg.senderUid !== msg.senderUid ||
                      showDateSep)
                  const participantRole = participants.find(
                    (p) => p.uid === msg.senderUid,
                  )?.role
                  const color = avatarColor(msg.senderUid)

                  return (
                    <div key={msg.id}>
                      {/* Date separator */}
                      {showDateSep && (
                        <div className="my-5 flex items-center gap-3">
                          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            {formatDateSep(msg.createdAt)}
                          </span>
                          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                        </div>
                      )}

                      {/* Message row */}
                      <div
                        className={`mb-2 flex items-end gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white transition-opacity"
                          style={{
                            backgroundColor:
                              showSenderInfo || isOwn ? (isOwn ? '#2563EB' : color) : 'transparent',
                          }}
                        >
                          {(showSenderInfo || isOwn)
                            ? isOwn
                              ? getInitials(userFullName)
                              : getInitials(msg.senderName)
                            : null}
                        </div>

                        {/* Bubble column */}
                        <div
                          className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[65%]`}
                        >
                          {/* Meta row */}
                          {showSenderInfo && !isOwn && (
                            <div className="mb-1 flex items-center gap-1.5 px-0.5">
                              <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                {msg.senderName}
                              </span>
                              {participantRole === 'Administrador' && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                                  ADMINISTRADOR
                                </span>
                              )}
                              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          {isOwn && (
                            <div className="mb-1 flex items-center gap-1.5 px-0.5">
                              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                                {formatTime(msg.createdAt)}
                              </span>
                              <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                Tú
                              </span>
                            </div>
                          )}
                          {!showSenderInfo && !isOwn && (
                            <div className="mb-1 px-0.5">
                              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          )}

                          {/* Bubble */}
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                              isOwn
                                ? 'rounded-tr-sm bg-blue-600 text-white'
                                : 'rounded-tl-sm border border-slate-100 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Message input ── */}
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 transition-colors duration-200">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                id="chat-message-input"
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje aquí..."
                maxLength={2000}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
              />

              <button
                type="button"
                aria-label="Emoji"
                className="shrink-0 cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <Smile size={18} />
              </button>

              <button
                id="chat-send-button"
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={sending || !newMessage.trim()}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
        </main>

        {/* ──────────── RIGHT SIDEBAR ──────────── */}
        <aside className={`
          ${showParticipants ? 'flex fixed inset-y-0 right-0 z-45 shadow-xl w-72' : 'hidden'} 
          lg:flex lg:relative lg:w-72 shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-200
        `}>
          {/* Participants header */}
          <div className="px-4 pb-3 pt-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
              Participantes
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                {onlineCount} ONLINE
              </span>
              <button
                type="button"
                onClick={() => setShowParticipants(false)}
                className="lg:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-350"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Participants list */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
            {participants.length === 0 && (
              <p className="text-[12px] text-slate-600 dark:text-slate-400">
                Sin participantes cargados.
              </p>
            )}
            {participants.map((p) => {
              const fullName =
                `${p.firstName} ${p.lastName}`.trim() || p.username
              const color = avatarColor(p.uid)
              const isOnline = onlineParticipants.some((op) => op.uid === p.uid)
              return (
                <div key={p.uid} className="flex items-center gap-2.5">
                  <div className="relative">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(fullName)}
                    </div>
                    <span 
                      className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-650'
                      }`} 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                      {fullName}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>
      </div>

      {/* Edit Name Modal */}
      {editingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar nombre de la sala</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={50}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900/30"
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingName(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
    </div>
  )
}
