import { useEffect, useRef, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  Send,
  Bell,
  Settings,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../contexts/useAuth'
import { auth } from '../lib/firebase'
import { useWebRTC } from '../hooks/useWebRTC'
import { joinRoom, getRoomParticipants } from '../services/rooms.service'
import { socket } from '../lib/socket'
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

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#10B981', '#3B82F6']
function avatarColor(uid: string): string {
  let hash = 0
  for (const c of uid) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// Subcomponent: Video Box
function VideoBox({ stream, isLocal, name, isAudioMuted }: { stream: MediaStream | null, isLocal: boolean, name: string, isAudioMuted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-900 shadow-sm">
      {stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-500">
          <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-slate-700 text-2xl font-bold text-white shadow-inner">
            {getInitials(name)}
          </div>
        </div>
      )}
      
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1.5 backdrop-blur-md">
        <span className="text-xs font-medium text-white">{name}</span>
      </div>
      
      {isAudioMuted && (
        <div className="absolute right-3 top-3 flex items-center justify-center rounded-full bg-red-500/90 p-1.5 backdrop-blur-md">
          <MicOff size={14} className="text-white" />
        </div>
      )}
    </div>
  )
}

export default function VideoCallPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  
  // Mapeo de SocketId a UID para identificar a los remotos
  const [activeSockets, setActiveSockets] = useState<Map<string, string>>(new Map())
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)

  const { localStream, remoteStreams, startLocalStream, stopLocalStream, toggleMic, toggleCamera } = useWebRTC(roomId!, user?.uid || '')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cargar sala
  useEffect(() => {
    if (!roomId) return
    let cancelled = false
    async function load() {
      try {
        const r = await joinRoom(roomId!)
        if (!cancelled) setRoom(r)
        const ps = await getRoomParticipants(roomId!)
        if (!cancelled) setParticipants(ps)
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [roomId])

  // Inicializar WebRTC y Sockets
  useEffect(() => {
    if (!room || !user) return

    const initCall = async () => {
      await startLocalStream()
      
      const token = await auth.currentUser?.getIdToken()
      if (!token) return
      
      socket.auth = { token }
      
      const joinRoomSocket = () => {
        const participant: RoomParticipant = {
          uid: user.uid,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          provider: user.provider,
          createdAt: user.createdAt,
          joinedAt: new Date().toISOString(),
          role: room.createdBy === user.uid ? 'Administrador' : 'Participante'
        }
        socket.emit('join-room', { roomId: room.id, participant })
      }

      if (socket.connected) {
        joinRoomSocket()
      } else {
        socket.connect()
        socket.once('connect', joinRoomSocket)
      }
    }

    const handleUserJoined = (payload: { roomId: string, participant: RoomParticipant, socketId: string, uid: string }) => {
      if (payload.roomId !== room.id) return
      setParticipants(prev => {
        const exists = prev.some(p => p.uid === payload.uid)
        return exists ? prev : [...prev, payload.participant]
      })
      setActiveSockets(prev => {
        const next = new Map(prev)
        next.set(payload.socketId, payload.uid)
        return next
      })
    }

    const handleUserLeft = (payload: { socketId: string, uid: string }) => {
      setActiveSockets(prev => {
        const next = new Map(prev)
        next.delete(payload.socketId)
        return next
      })
    }

    const handleChatHistory = (payload: { roomId: string; messages: ChatMessage[] }) => {
      if (payload.roomId !== room.id) return
      setMessages(payload.messages)
    }

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.roomId !== room.id) return
      setMessages(prev => [...prev, msg])
    }

    initCall()

    socket.on('user-joined', handleUserJoined)
    socket.on('user-left', handleUserLeft)
    socket.on('chat-history', handleChatHistory)
    socket.on('new-message', handleNewMessage)

    return () => {
      socket.off('user-joined', handleUserJoined)
      socket.off('user-left', handleUserLeft)
      socket.off('chat-history', handleChatHistory)
      socket.off('new-message', handleNewMessage)
      socket.off('connect')
      socket.emit('leave-room', room.id)
      socket.disconnect()
      stopLocalStream()
    }
  }, [room, user, startLocalStream, stopLocalStream])

  const handleSendMessage = () => {
    const trimmed = newMessage.trim()
    if (!trimmed || !room) return
    socket.emit('send-message', { roomId: room.id, content: trimmed })
    setNewMessage('')
  }

  const handleMicToggle = () => {
    const state = toggleMic()
    setMicEnabled(state)
  }

  const handleCameraToggle = () => {
    const state = toggleCamera()
    setCameraEnabled(state)
  }

  const leaveCall = () => {
    navigate(`/salas/${roomId}/chat`)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }
  
  if (error || !room) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <h1 className="text-xl font-bold">Error</h1>
        <p className="text-slate-500 mb-4">{error || 'No se pudo cargar.'}</p>
        <button onClick={leaveCall} className="rounded-xl bg-blue-600 px-5 py-2.5 text-white">Volver</button>
      </div>
    )
  }

  const userFullName = user ? `${user.firstName} ${user.lastName}`.trim() || user.username : ''

  // Cálculos para la cuadrícula
  const totalVideos = remoteStreams.size + 1 // Remotos + Local
  const gridColumns = totalVideos === 1 ? 'grid-cols-1' :
                      totalVideos === 2 ? 'grid-cols-1 md:grid-cols-2' :
                      totalVideos <= 4 ? 'grid-cols-2' :
                      totalVideos <= 6 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-3'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-blue-800">Salón de Estudio</h1>
          <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
            En vivo • {room.name}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="text-slate-400 hover:text-slate-600"><Bell size={18} /></button>
          <button className="text-slate-400 hover:text-slate-600"><Settings size={18} /></button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {getInitials(userFullName)}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex flex-1 overflow-hidden p-4 gap-4">
        
        {/* Left: Video Grid */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden">
          {/* Grid */}
          <div className={`flex-1 grid gap-4 p-2 overflow-y-auto ${gridColumns}`}>
            
            {/* Local Video */}
            <div className="w-full h-full min-h-[200px]">
              <VideoBox 
                stream={localStream} 
                isLocal={true} 
                name={`Tú (${userFullName})`} 
                isAudioMuted={!micEnabled} 
              />
            </div>
            
            {/* Remote Videos */}
            {Array.from(remoteStreams.entries()).map(([socketId, stream]) => {
              const uid = activeSockets.get(socketId)
              const participant = participants.find(p => p.uid === uid)
              const name = participant ? `${participant.firstName} ${participant.lastName}`.trim() || participant.username : 'Conectando...'
              const role = participant?.role === 'Administrador' ? 'Prof. ' : ''
              
              return (
                <div key={socketId} className="w-full h-full min-h-[200px]">
                  <VideoBox 
                    stream={stream} 
                    isLocal={false} 
                    name={`${role}${name}`} 
                  />
                </div>
              )
            })}
          </div>

          {/* Controls Bar */}
          <div className="mt-4 flex shrink-0 items-center justify-center">
            <div className="flex items-center gap-2 rounded-2xl bg-blue-100/50 px-6 py-3 shadow-sm backdrop-blur-md border border-blue-200/50">
              
              <button 
                onClick={handleMicToggle}
                className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-blue-900 transition-colors hover:bg-blue-200"
              >
                {micEnabled ? <Mic size={20} /> : <MicOff size={20} className="text-red-500" />}
                <span className="text-[10px] font-medium">{micEnabled ? 'Silenciar' : 'Activar'}</span>
              </button>
              
              <button 
                onClick={handleCameraToggle}
                className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-blue-900 transition-colors hover:bg-blue-200"
              >
                {cameraEnabled ? <VideoIcon size={20} /> : <VideoOff size={20} className="text-red-500" />}
                <span className="text-[10px] font-medium">Cámara</span>
              </button>
              
              <button 
                className="flex flex-col items-center gap-1 rounded-xl bg-blue-600 p-2.5 text-white transition-colors hover:bg-blue-700 shadow-sm"
              >
                <MonitorUp size={20} />
                <span className="text-[10px] font-medium">Compartir</span>
              </button>
              
              <button className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-blue-900 transition-colors hover:bg-blue-200">
                <MoreHorizontal size={20} />
                <span className="text-[10px] font-medium">Más</span>
              </button>
              
              <div className="mx-2 h-10 w-px bg-blue-300/50" />
              
              <button 
                onClick={leaveCall}
                className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-red-600 transition-colors hover:bg-red-100"
              >
                <div className="rounded-full bg-red-600 p-2 text-white">
                  <PhoneOff size={16} />
                </div>
                <span className="text-[10px] font-bold text-red-600">Salir</span>
              </button>

            </div>
          </div>
        </div>

        {/* Right: Sidebar Chat */}
        <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">Classroom</h2>
            <p className="text-xs text-slate-500">Chat de la sesión</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-slate-400">No hay mensajes aún.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map(msg => {
                  const isOwn = msg.senderUid === user?.uid
                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className="mb-1 flex items-center gap-2">
                        {!isOwn && <span className="text-xs font-semibold text-blue-600">{msg.senderName}</span>}
                        <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)} {isOwn && 'Tú'}</span>
                      </div>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${isOwn ? 'bg-blue-700 text-white rounded-tr-sm' : 'bg-slate-50 text-slate-700 rounded-tl-sm border border-slate-100'}`}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white disabled:opacity-50 transition-transform active:scale-95"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </aside>
        
      </main>
    </div>
  )
}
