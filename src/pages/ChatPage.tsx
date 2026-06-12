import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react'
import DashboardHeader from '../components/DashboardHeader'
import { useAuth } from '../contexts/useAuth'
import { auth } from '../lib/firebase'
import { socket } from '../lib/socket'
import { joinRoom, getRoomParticipants } from '../services/rooms.service'
import type { Room, RoomParticipant } from '../types/room.types'

interface ChatMessage {
  id: string
  roomId: string
  senderUid: string
  senderName: string
  senderUsername: string
  content: string
  createdAt: string
}

interface LocationState {
  room?: Room
}


function getParticipantInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}


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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /* Auto-Scroll */

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /* Cargar Participantes */

  useEffect(() => {
    if (!roomId) return

    let cancelled = false

    async function loadRoom() {
      setLoading(true)
      setError('')

      try {
        const resolvedRoom = await joinRoom(roomId!)
        if (!cancelled) setRoom(resolvedRoom)

        const roomParticipants = await getRoomParticipants(roomId!)
        if (!cancelled) setParticipants(roomParticipants)
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
    return () => { cancelled = true }
  }, [roomId])

  /* Conexión Socket */

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

    const handleChatHistory = (payload: { roomId: string; messages: ChatMessage[] }) => {
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

  /* Envío de mensaje */

  const handleSendMessage = async () => {
    const trimmed = newMessage.trim()
    if (!trimmed || !room || sending) return

    setSending(true)
    try {
      socket.emit('send-message', { roomId: room.id, content: trimmed })
      setNewMessage('')
      inputRef.current?.focus()
    } catch {
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

  if (loading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50/30 dark:bg-slate-950">
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center text-slate-500 dark:text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Abriendo chat...
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
              No se pudo abrir el chat
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30 dark:bg-slate-950">
      <DashboardHeader />

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </button>

        {/* Tab navigation */}
        <div className="mb-6 flex gap-1 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate(`/salas/${roomId}`)}
            className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-b-2 border-transparent"
          >
            Sala
          </button>
          <button
            type="button"
            className="px-4 py-2.5 text-sm font-semibold text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
          >
            Chat
          </button>
        </div>

        {/* Chat container */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Messages area */}
          <section className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">
            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Chat de {room.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Mensajes en tiempo real de la sala.
              </p>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: '45vh' }}>
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center py-12">
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Aún no hay mensajes. ¡Sé el primero en escribir!
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.senderUid === user?.uid

                    return (
                      <li
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                          }`}
                        >
                          {!isOwn && (
                            <p className="mb-1 text-xs font-bold opacity-70">
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p
                            className={`mt-1 text-right text-[10px] ${
                              isOwn ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  maxLength={2000}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Sidebar: Participants */}
          <aside className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Participantes conectados
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {participants.length} {participants.length === 1 ? 'persona en' : 'personas en'} la sala
            </p>

            <ul className="mt-6 space-y-3">
              {participants.length === 0 ? (
                <li className="rounded-xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Sin participantes cargados.
                </li>
              ) : (
                participants.map((participant) => {
                  const fullName = `${participant.firstName} ${participant.lastName}`.trim() || participant.username

                  return (
                    <li
                      key={participant.uid}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {getParticipantInitials(fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {fullName}
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

            <div className="mt-6 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Info rápida</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Mensajes en tiempo real</li>
                <li>• Máximo 2000 caracteres</li>
                <li>• Historial de la sesión</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
