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
  PlusCircle,
  Copy,
  Edit2,
  Check,
  Trash2,
  Play,
  Search,
  MoreVertical,
} from 'lucide-react'
import { useAuth } from '../contexts/useAuth'
import { auth } from '../lib/firebase'
import { socket } from '../lib/socket'
import { joinRoom, getRoomParticipants, updateRoom, deleteRoom } from '../services/rooms.service'
import DashboardHeader from '../components/DashboardHeader'
import type { Room, RoomParticipant } from '../types/room.types'

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
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCopyId = () => {
    if (!room) return
    navigator.clipboard.writeText(room.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isOwner = user && room && room.createdBy === user.uid

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

    return () => {
      socket.off('chat-history', handleChatHistory)
      socket.off('new-message', handleNewMessage)
      socket.off('message-error', handleMessageError)
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
        <span className="text-sm text-slate-500 dark:text-slate-400">Abriendo chat...</span>
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
        <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'Sala no encontrada.'}</p>
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
      <div className="flex flex-1 overflow-hidden">

        {/* ──────────── LEFT SIDEBAR ──────────── */}
        <aside className="flex w-52 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200">
          {/* Room card */}
          <div className="m-3 mb-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-3 text-white shadow-sm">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white/20 p-1.5">
                  <BookOpen size={14} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-tight">
                    {room.name}
                  </p>
                  <p className="text-[11px] text-blue-100">Sesión Activa</p>
                </div>
              </div>
            </div>
          </div>

          {/* GESTIÓN DE SALA */}
          <div className="mx-3 mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400">GESTIÓN DE SALA</span>
              {isOwner && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                  PROPIETARIO
                </span>
              )}
            </div>

            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{room.name}</span>
              {isOwner && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { setNewName(room.name); setEditingName(true); }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                    title="Editar nombre"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={handleDeleteRoom}
                    disabled={deleting}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Eliminar sala"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400">ID DE SALA</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate max-w-[120px]">#{room.id.substring(0, 8).toUpperCase()}</span>
                <button 
                  onClick={handleCopyId}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  title="Copiar ID completo"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ArrowLeft size={14} />
              Volver al dashboard
            </button>
          </div>
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
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50/80 dark:bg-blue-950/40">
                  <BookOpen size={22} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">{room.name}</h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{participants.length} participantes activos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors">
                  <Search size={20} />
                </button>
                <button className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors">
                  <MoreVertical size={20} />
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
                <p className="text-sm text-slate-400 dark:text-slate-500">
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
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
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
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          {isOwn && (
                            <div className="mb-1 flex items-center gap-1.5 px-0.5">
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                {formatTime(msg.createdAt)}
                              </span>
                              <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                                Tú
                              </span>
                            </div>
                          )}
                          {!showSenderInfo && !isOwn && (
                            <div className="mb-1 px-0.5">
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
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
              <button
                type="button"
                aria-label="Adjuntar archivo"
                className="shrink-0 cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <PlusCircle size={18} />
              </button>

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
        <aside className="flex w-72 shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200">
          {/* Participants header */}
          <div className="px-4 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                Participantes
              </h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                {participants.length} ONLINE
              </span>
            </div>
          </div>

          {/* Participants list */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
            {participants.length === 0 && (
              <p className="text-[12px] text-slate-400 dark:text-slate-500">
                Sin participantes cargados.
              </p>
            )}
            {participants.map((p) => {
              const fullName =
                `${p.firstName} ${p.lastName}`.trim() || p.username
              const color = avatarColor(p.uid)
              return (
                <div key={p.uid} className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {getInitials(fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                      {fullName}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Micrófono"
                    className="shrink-0 cursor-pointer text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
                  >
                    <Mic size={13} />
                  </button>
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
