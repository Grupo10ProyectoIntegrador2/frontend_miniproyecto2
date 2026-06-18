import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
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
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../contexts/useAuth'
import { auth } from '../lib/firebase'
import { useWebRTC } from '../hooks/useWebRTC'
import { joinRoom, getRoomParticipants } from '../services/rooms.service'
import { socket } from '../lib/socket'
import DashboardHeader from '../components/DashboardHeader'
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
  return name
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
    .split(' ')
    .filter(w => w.length > 0)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
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
  const [hasVideo, setHasVideo] = useState(false)
  
  useEffect(() => {
    const el = videoRef.current
    if (el && stream) {
      el.srcObject = stream
      
      const checkVideoTrack = () => {
        const videoTrack = stream.getVideoTracks()[0]
        setHasVideo(!!videoTrack && videoTrack.enabled && videoTrack.readyState === 'live')
      }
      
      checkVideoTrack()

      // Autoplay policy: browsers block unmuted autoplay.
      // Start muted, play, then unmute remote streams for audio.
      el.muted = true
      el.play()
        .then(() => {
          if (!isLocal) el.muted = false
        })
        .catch(() => {
          // Stays muted if autoplay still blocked
        })
      
      // Listen to track changes
      stream.onaddtrack = checkVideoTrack
      stream.onremovetrack = checkVideoTrack
      
      const videoTracks = stream.getVideoTracks()
      videoTracks.forEach(track => {
        track.onmute = checkVideoTrack
        track.onunmute = checkVideoTrack
        track.onended = checkVideoTrack
      })
      
      return () => {
        stream.onaddtrack = null
        stream.onremovetrack = null
        videoTracks.forEach(track => {
          track.onmute = null
          track.onunmute = null
          track.onended = null
        })
      }
    } else {
      setHasVideo(false)
    }
  }, [stream, isLocal])

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-900 shadow-sm">
      {/* Always keep video in DOM (opacity instead of hidden) so it can receive & decode frames */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${hasVideo ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {!hasVideo && (
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

  const localParticipant = useMemo(() => {
    if (!user || !room) return undefined
    return {
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
  }, [user, room])

  const handlePeerMetadataReceived = useCallback((socketId: string, uid: string, participant: RoomParticipant) => {
    setActiveSockets(prev => {
      const next = new Map(prev)
      next.set(socketId, uid)
      return next
    })
    setParticipants(prev => {
      const exists = prev.some(p => p.uid === uid)
      return exists ? prev : [...prev, participant]
    })
  }, [])

  const { localStream, remoteStreams, peerSocketIds, startLocalStream, stopLocalStream, toggleMic, toggleCamera, permissionError } = useWebRTC(
    roomId!,
    user?.uid || '',
    localParticipant,
    handlePeerMetadataReceived
  )

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
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

    const initSocket = async () => {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return
      
      socket.auth = { token }
      
      const joinRoomSocket = () => {
        if (localParticipant) {
          socket.emit('join-room', { roomId: room.id, participant: localParticipant })
        }
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
      setMessages(prev => [...prev, msg])
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 100)
    }

    // Iniciar stream y sockets en paralelo
    void startLocalStream()
    void initSocket()

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
  }, [room, user, startLocalStream, stopLocalStream, localParticipant])

  const handleSendMessage = () => {
    const trimmed = newMessage.trim()
    if (!trimmed || !room) return
    try {
      socket.emit('send-message', { roomId: room.id, content: trimmed })
      setNewMessage('')
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 100)
    } catch {
      // ignore
    }
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

  // Build set of remote participants (with or without video)
  // Combine remote streams + activeSockets + peerSocketIds to show participants even without camera
  const allRemoteSocketIds = new Set([
    ...Array.from(remoteStreams.keys()),
    ...Array.from(activeSockets.keys()),
    ...Array.from(peerSocketIds)
  ])

  // Cálculos para la cuadrícula
  const totalVideos = allRemoteSocketIds.size + 1 // Remotos + Local
  const gridColumns = totalVideos === 1 ? 'grid-cols-1' :
                      totalVideos === 2 ? 'grid-cols-1 md:grid-cols-2' :
                      totalVideos <= 4 ? 'grid-cols-2' :
                      totalVideos <= 6 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-3'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans">
      {/* Header — same DashboardHeader used in other views */}
      <DashboardHeader fullWidth={true} />

      {/* Sub-header: back link + live badge */}
      <div className="flex h-10 shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft size={14} />
          Volver al dashboard
        </button>
        <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
          <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
          En vivo • {room.name}
        </div>
      </div>

      {/* Main Layout */}
      <main className="flex flex-1 overflow-hidden p-4 gap-4">
        
        {/* Left: Video Grid */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden">
          {permissionError && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700 shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <div className="text-sm font-medium">{permissionError}</div>
            </div>
          )}
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
            {Array.from(allRemoteSocketIds).map((socketId) => {
              const stream = remoteStreams.get(socketId) || null
              const uid = activeSockets.get(socketId)
              let participant = uid ? participants.find(p => p.uid === uid) : null
              
              // Fallback: if DataChannel metadata hasn't arrived, find unmatched participant
              if (!participant) {
                const mappedUids = new Set(activeSockets.values())
                const unmapped = participants.filter(
                  p => p.uid !== user?.uid && !mappedUids.has(p.uid)
                )
                if (unmapped.length === 1) {
                  participant = unmapped[0]
                }
              }
              
              const name = participant ? `${participant.firstName} ${participant.lastName}`.trim() || participant.username : 'Participante'
              
              return (
                <div key={socketId} className="w-full h-full min-h-[200px]">
                  <VideoBox 
                    stream={stream} 
                    isLocal={false} 
                    name={name} 
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
          {/* Participantes */}
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Participantes</h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {participants.length} ONLINE
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {participants.map((p) => {
                const fullName = `${p.firstName} ${p.lastName}`.trim() || p.username
                return (
                  <div key={p.uid} className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: avatarColor(p.uid) }}
                    >
                      {getInitials(fullName)}
                    </div>
                    <span className="truncate text-xs font-medium text-slate-700">{fullName}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Chat header */}
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-900">Chat de la sesión</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-xs text-slate-400">No hay mensajes aún.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-2">
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
                <div ref={messagesEndRef} className="h-1" />
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
