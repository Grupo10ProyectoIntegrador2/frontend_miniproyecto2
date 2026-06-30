import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Send,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '../contexts/useAuth'
import { auth } from '../lib/firebase'
import { useWebRTC } from '../hooks/useWebRTC'
import { joinRoom } from '../services/rooms.service'
import { socket } from '../lib/socket'
import DashboardHeader from '../components/DashboardHeader'
import type { Room, RoomParticipant } from '../types/room.types'
import type { VideoCallStatus } from '../types/videoCall.types'

interface ChatMessage {
  id: string
  roomId: string
  senderUid: string
  senderName: string
  senderUsername: string
  content: string
  createdAt: string
}

interface VideoCallPeerState {
  uid: string
  socketId: string
  audioMuted: boolean
  videoMuted: boolean
  isScreenSharing: boolean
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

const AVATAR_COLORS = ['#4338ca', '#6d28d9', '#be185d', '#0f766e', '#b45309', '#047857', '#1d4ed8']
function avatarColor(uid: string): string {
  let hash = 0
  for (const c of uid) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function isAvatarImage(url?: string): boolean {
  if (!url) return false
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')
}

const PRESET_AVATAR_COLORS: Record<string, string> = {
  'avatar-1': '#4338ca',
  'avatar-2': '#047857',
  'avatar-3': '#b45309',
  'avatar-4': '#b91c1c',
  'avatar-5': '#1d4ed8',
  'avatar-6': '#be185d',
  'avatar-7': '#6d28d9',
  'avatar-8': '#0f766e',
}

function resolveAvatarBackground(uid: string, avatarUrl?: string): string {
  if (avatarUrl && !isAvatarImage(avatarUrl)) {
    return PRESET_AVATAR_COLORS[avatarUrl] ?? avatarColor(uid)
  }
  return avatarColor(uid)
}

function cleanDisplayName(name: string): string {
  return name.replace(/^Tú\s*\(/, '').replace(/\)$/, '').trim() || name
}

// Subcomponent: Video Box
function VideoBox({
  stream,
  isLocal,
  name,
  displayName,
  uid = '',
  avatarUrl,
  isAudioMuted,
  isVideoMuted = false,
  isScreenSharing = false,
  cameraOn,
}: {
  stream: MediaStream | null
  isLocal: boolean
  name: string
  displayName?: string
  uid?: string
  avatarUrl?: string
  isAudioMuted?: boolean
  isVideoMuted?: boolean
  isScreenSharing?: boolean
  cameraOn?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasVideo, setHasVideo] = useState(false)
  const label = displayName ?? cleanDisplayName(name)
  const initials = getInitials(label)
  const avatarBackground = resolveAvatarBackground(uid, avatarUrl)
  const showAvatar = cameraOn === false || !hasVideo

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    if (!stream) {
      el.srcObject = null
      setHasVideo(false)
      return
    }

    el.srcObject = stream
      
    const checkVideoTrack = () => {
      const videoTrack = stream.getVideoTracks()[0]
      const trackLive = !!videoTrack && videoTrack.enabled && videoTrack.readyState === 'live'
      setHasVideo(trackLive && !isVideoMuted)
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
  }, [stream, isLocal, isVideoMuted])

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl shadow-sm transition-colors duration-300 ${
        showAvatar ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-900'
      }`}
    >
      {/* Always keep video in DOM (opacity instead of hidden) so it can receive & decode frames */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
          hasVideo
            ? isScreenSharing
              ? 'object-contain opacity-100'
              : 'object-cover opacity-100'
            : 'object-cover opacity-0'
        }`}
      />
      
      {showAvatar && (
        <div className="flex flex-col items-center justify-center">
          {avatarUrl && isAvatarImage(avatarUrl) ? (
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full shadow-md ring-4 ring-white/80 dark:ring-slate-700/80">
              <img
                src={avatarUrl}
                alt={label}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white shadow-md ring-4 ring-white/80 dark:ring-slate-700/80"
              style={{ backgroundColor: avatarBackground }}
            >
              {initials}
            </div>
          )}
        </div>
      )}
      
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1.5 backdrop-blur-md">
        <span className="text-xs font-medium text-white">{name}</span>
      </div>
      
      {isScreenSharing && (
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1 rounded-full bg-blue-600/90 px-2 py-1 backdrop-blur-md">
            <MonitorUp size={12} className="text-white" />
            <span className="text-[10px] font-medium text-white">Presentando</span>
          </div>
          {isAudioMuted && (
            <div className="flex items-center justify-center rounded-full bg-red-500/90 p-1.5 backdrop-blur-md">
              <MicOff size={14} className="text-white" />
            </div>
          )}
          {isVideoMuted && (
            <div className="flex items-center justify-center rounded-full bg-slate-700/90 p-1.5 backdrop-blur-md">
              <VideoOff size={14} className="text-white" />
            </div>
          )}
        </div>
      )}

      {!isScreenSharing && (isAudioMuted || isVideoMuted) && (
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {isAudioMuted && (
            <div className="flex items-center justify-center rounded-full bg-red-500/90 p-1.5 backdrop-blur-md">
              <MicOff size={14} className="text-white" />
            </div>
          )}
          {isVideoMuted && (
            <div className="flex items-center justify-center rounded-full bg-slate-700/90 p-1.5 backdrop-blur-md">
              <VideoOff size={14} className="text-white" />
            </div>
          )}
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
  const [videoCallPeers, setVideoCallPeers] = useState<Map<string, VideoCallPeerState>>(new Map())
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [showChat, setShowChat] = useState(false)

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
    } as RoomParticipant
  }, [user, room])

  const callParticipants = useMemo(() => {
    const byUid = new Map<string, RoomParticipant>()

    for (const participant of participants) {
      byUid.set(participant.uid, participant)
    }

    if (localParticipant) {
      byUid.set(localParticipant.uid, localParticipant)
    }

    return Array.from(byUid.values())
  }, [localParticipant, participants])

  const handlePeerMetadataReceived = useCallback((socketId: string, uid: string, participant: RoomParticipant) => {
    setVideoCallPeers(prev => {
      const existing = prev.get(socketId)
      if (existing) return prev
      const next = new Map(prev)
      next.set(socketId, {
        uid,
        socketId,
        audioMuted: false,
        videoMuted: false,
        isScreenSharing: false,
      })
      return next
    })
    setParticipants(prev => {
      const exists = prev.some(p => p.uid === uid)
      return exists ? prev : [...prev, participant]
    })
  }, [])

  const handlePeerMediaStatusReceived = useCallback((socketId: string, uid: string, isAudioMuted: boolean, cameraOn: boolean) => {
    setVideoCallPeers(prev => {
      const existing = prev.get(socketId)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(socketId, {
        ...existing,
        audioMuted: isAudioMuted,
        videoMuted: !cameraOn
      })
      return next
    })
  }, [])

  const {
    localStream,
    screenStream,
    remoteStreams,
    isScreenSharing,
    startLocalStream,
    stopLocalStream,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    permissionError,
    syncPeers,
  } = useWebRTC(
    roomId!,
    user?.uid || '',
    localParticipant,
    handlePeerMetadataReceived,
    handlePeerMediaStatusReceived
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
          socket.emit('join-video-call', { roomId: room.id, participant: localParticipant })
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
      if (payload.uid === user.uid) return
      setParticipants(prev => {
        const exists = prev.some(p => p.uid === payload.uid)
        return exists ? prev : [...prev, payload.participant]
      })
    }

    const handleUserLeft = (payload: { socketId: string, uid: string }) => {
      setVideoCallPeers(prev => {
        if (!prev.has(payload.socketId)) return prev
        const next = new Map(prev)
        next.delete(payload.socketId)
        return next
      })
      if (payload.uid) {
        setParticipants(prev => prev.filter(p => p.uid !== payload.uid))
      }
    }

    const applyVideoCallStatus = (payload: {
      roomId: string
      participants?: RoomParticipant[]
      states?: Array<{
        uid: string
        socketId: string
        audioMuted: boolean
        videoMuted: boolean
        isScreenSharing: boolean
      }>
    }) => {
      if (payload.roomId !== room.id) return

      const peers = new Map<string, VideoCallPeerState>()
      const activeSocketIds = new Set<string>()

      payload.states?.forEach((state) => {
        if (!state.socketId) return
        activeSocketIds.add(state.socketId)
        peers.set(state.socketId, {
          uid: state.uid,
          socketId: state.socketId,
          audioMuted: state.audioMuted,
          videoMuted: state.videoMuted,
          isScreenSharing: state.isScreenSharing,
        })
      })

      setVideoCallPeers(peers)
      syncPeers(activeSocketIds)

      if (payload.participants && payload.participants.length > 0) {
        setParticipants(payload.participants)
      } else if (payload.states) {
        const uidsInCall = new Set(payload.states.map((state) => state.uid))
        setParticipants(prev => prev.filter(p => uidsInCall.has(p.uid)))
      }
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

    const handleVideoCallStatus = (payload: {
      roomId: string
      participants?: RoomParticipant[]
      states?: Array<{
        uid: string
        socketId: string
        audioMuted: boolean
        videoMuted: boolean
        isScreenSharing: boolean
      }>
    }) => {
      applyVideoCallStatus(payload)
    }

    const handleScreenShareChanged = (payload: {
      uid: string
      socketId: string
      isScreenSharing: boolean
    }) => {
      setVideoCallPeers(prev => {
        const next = new Map(prev)
        for (const [socketId, peer] of next) {
          if (peer.uid === payload.uid) {
            next.set(socketId, { ...peer, isScreenSharing: payload.isScreenSharing })
          }
        }
        return next
      })
    }

    const handleAvStateChanged = (payload: {
      uid: string
      socketId: string
      audioMuted: boolean
      videoMuted: boolean
    }) => {
      setVideoCallPeers(prev => {
        const next = new Map(prev)
        for (const [socketId, peer] of next) {
          if (peer.uid === payload.uid) {
            next.set(socketId, {
              ...peer,
              audioMuted: payload.audioMuted,
              videoMuted: payload.videoMuted,
            })
          }
        }
        return next
      })
    }

    // Iniciar stream ANTES de conectar sockets para que los tracks
    // locales estén disponibles cuando lleguen eventos user-joined
    const init = async () => {
      // Start both in parallel – socket connection should NOT depend on media access
      const [stream] = await Promise.all([
        startLocalStream(),
        initSocket()
      ])
      // If stream failed, log but don't block – user can still receive remote streams
      if (!stream) {
        console.warn('[VideoCall] Local media not available – joining as receive-only')
      }
    }
    void init()

    socket.on('user-joined', handleUserJoined)
    socket.on('user-left', handleUserLeft)
    socket.on('chat-history', handleChatHistory)
    socket.on('new-message', handleNewMessage)
    socket.on('video-call-status', handleVideoCallStatus)
    socket.on('screen-share-changed', handleScreenShareChanged)
    socket.on('av-state-changed', handleAvStateChanged)

    return () => {
      socket.off('user-joined', handleUserJoined)
      socket.off('user-left', handleUserLeft)
      socket.off('chat-history', handleChatHistory)
      socket.off('new-message', handleNewMessage)
      socket.off('video-call-status', handleVideoCallStatus)
      socket.off('screen-share-changed', handleScreenShareChanged)
      socket.off('av-state-changed', handleAvStateChanged)
      socket.off('connect')
      socket.emit('leave-video-call', { roomId: room.id })
      socket.emit('leave-room', room.id)
      socket.disconnect()
      stopLocalStream()
    }
  }, [room, user, startLocalStream, stopLocalStream, localParticipant, syncPeers])

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

  const emitAvState = (audioMuted: boolean, videoMuted: boolean) => {
    if (!room) return
    socket.emit('toggle-av', { roomId: room.id, audioMuted, videoMuted })
  }

  const handleMicToggle = () => {
    const state = toggleMic()
    setMicEnabled(state)
    emitAvState(!state, !cameraEnabled)
  }

  const handleCameraToggle = () => {
    const state = toggleCamera()
    setCameraEnabled(state)
    emitAvState(!micEnabled, !state)
  }

  const handleScreenShareToggle = async () => {
    await toggleScreenShare()
  }

  const leaveCall = () => {
    if (room) {
      socket.emit('leave-video-call', { roomId: room.id })
    }
    navigate(`/salas/${roomId}/chat`)
  }

  const allRemoteSocketIds = useMemo(() => {
    return Array.from(videoCallPeers.entries())
      .filter(([, peer]) => peer.uid !== user?.uid)
      .map(([socketId]) => socketId)
  }, [videoCallPeers, user?.uid])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }
  
  if (error || !room) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-200">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Error</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-4">{error || 'No se pudo cargar.'}</p>
        <button onClick={leaveCall} className="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700">Volver</button>
      </div>
    )
  }

  const userFullName = user ? `${user.firstName} ${user.lastName}`.trim() || user.username : ''

  const totalVideos = allRemoteSocketIds.length + 1
  const gridColumns = totalVideos === 1 ? 'grid-cols-1' :
                      totalVideos === 2 ? 'grid-cols-1 md:grid-cols-2' :
                      totalVideos <= 4 ? 'grid-cols-2' :
                      totalVideos <= 6 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-3'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      <DashboardHeader fullWidth={true} />

      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 px-6 transition-colors duration-200">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 cursor-pointer"
          >
            <ArrowLeft size={14} />
            Volver al dashboard
          </button>
          <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300 truncate">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse shrink-0"></span>
            <span className="truncate">En vivo • {room.name}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowChat(!showChat)}
          className="lg:hidden flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <MessageSquare size={13} />
          {showChat ? 'Ocultar Chat' : 'Ver Chat'}
        </button>
      </div>

      {/* Main Layout */}
      <main id="main-content" className="flex flex-1 overflow-hidden p-4 gap-4 relative">
        {/* Backdrop for Mobile Chat Drawer */}
        {showChat && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
            onClick={() => setShowChat(false)}
          />
        )}
        
        {/* Left: Video Grid */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden">
          {permissionError && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700 shadow-sm dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div className="text-sm font-medium">{permissionError}</div>
            </div>
          )}
          {/* Grid */}
          <div className={`flex-1 grid gap-4 p-2 overflow-y-auto ${gridColumns}`}>
            
            {/* Local Video */}
            <div className="w-full h-full min-h-[200px]">
              <VideoBox
                stream={isScreenSharing && screenStream ? screenStream : localStream}
                isLocal={true}
                name={`Tú (${userFullName})`}
                displayName={userFullName}
                uid={user?.uid}
                avatarUrl={user?.avatarUrl}
                isAudioMuted={!micEnabled}
                isVideoMuted={!cameraEnabled && !isScreenSharing}
                isScreenSharing={isScreenSharing}
                cameraOn={cameraEnabled}
              />
            </div>
            
            {/* Remote Videos */}
            {allRemoteSocketIds.map((socketId) => {
              const stream = remoteStreams.get(socketId) || null
              const peerState = videoCallPeers.get(socketId)
              const uid = peerState?.uid
              const participant = uid ? participants.find(p => p.uid === uid) : null
              const name = participant
                ? `${participant.firstName} ${participant.lastName}`.trim() || participant.username
                : 'Participante'
              const remoteIsSharing = peerState?.isScreenSharing === true
              const remoteAv = peerState
                ? { audioMuted: peerState.audioMuted, videoMuted: peerState.videoMuted }
                : undefined
              
              return (
                <div key={socketId} className="w-full h-full min-h-[200px]">
                  <VideoBox
                    stream={stream}
                    isLocal={false}
                    name={name}
                    displayName={name}
                    uid={uid}
                    avatarUrl={participant?.avatarUrl}
                    isAudioMuted={remoteAv?.audioMuted}
                    isVideoMuted={remoteAv?.videoMuted && !remoteIsSharing}
                    isScreenSharing={remoteIsSharing}
                    cameraOn={remoteAv ? !remoteAv.videoMuted : true}
                  />
                </div>
              )
            })}
          </div>

          {/* Controls Bar */}
          <div className="mt-4 flex shrink-0 items-center justify-center">
            <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-6 py-3 shadow-sm backdrop-blur-md border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/80 transition-colors duration-200">
              
              <button 
                onClick={handleMicToggle}
                className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-slate-800 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label={micEnabled ? "Silenciar micrófono" : "Activar micrófono"}
                aria-pressed={!micEnabled}
              >
                {micEnabled ? <Mic size={20} /> : <MicOff size={20} className="text-red-500" />}
                <span className="text-[10px] font-medium">{micEnabled ? 'Silenciar' : 'Activar'}</span>
              </button>
              
              <button 
                onClick={handleCameraToggle}
                className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-slate-800 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label={cameraEnabled ? "Apagar cámara" : "Encender cámara"}
                aria-pressed={cameraEnabled}
              >
                {cameraEnabled ? <VideoIcon size={20} /> : <VideoOff size={20} className="text-red-500" />}
                <span className="text-[10px] font-medium">Cámara</span>
              </button>
              
              <button
                onClick={handleScreenShareToggle}
                className={`flex flex-col items-center gap-1 rounded-xl p-2.5 transition-colors ${
                  isScreenSharing
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-label={isScreenSharing ? "Detener compartir pantalla" : "Compartir pantalla"}
                aria-pressed={isScreenSharing}
              >
                <MonitorUp size={20} />
                <span className="text-[10px] font-medium">
                  {isScreenSharing ? 'Detener' : 'Compartir'}
                </span>
              </button>
              
              <button 
                onClick={leaveCall}
                className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-red-700 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/40"
                aria-label="Salir de la videollamada"
              >
                <div className="rounded-full bg-red-600 p-2 text-white">
                  <PhoneOff size={16} />
                </div>
                <span className="text-[10px] font-bold text-red-700 dark:text-red-400">Salir</span>
              </button>

            </div>
          </div>
        </div>

        {/* Right: Sidebar Chat */}
        <aside className={`
          ${showChat ? 'flex fixed inset-y-0 right-0 z-45 shadow-xl w-80 pt-16' : 'hidden'} 
          lg:flex lg:relative lg:w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-200
        `}>
          <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Participantes</h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {participants.length} ONLINE
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="lg:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-650 dark:hover:bg-slate-800 dark:hover:text-slate-350"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {callParticipants.map((p) => {
                const fullName = `${p.firstName} ${p.lastName}`.trim() || p.username
                const isAdmin = p.uid === room.createdBy || p.role === 'Administrador'
                return (
                  <div key={p.uid} className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: avatarColor(p.uid) }}
                    >
                      {getInitials(fullName)}
                    </div>
                    <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{fullName}</span>
                    {isAdmin && (
                      <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                        ADMINISTRADOR
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Chat de la sesión</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-xs text-slate-600 dark:text-slate-400">No hay mensajes aún.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-2">
                {messages.map(msg => {
                  const isOwn = msg.senderUid === user?.uid
                  const isAdmin = msg.senderUid === room.createdBy
                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className="mb-1 flex items-center gap-2">
                        {!isOwn && (
                          <>
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{msg.senderName}</span>
                            {isAdmin && (
                              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                                ADMINISTRADOR
                              </span>
                            )}
                          </>
                        )}
                        <span className="text-[10px] text-slate-600 dark:text-slate-300">{formatTime(msg.createdAt)} {isOwn && 'Tú'}</span>
                      </div>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${isOwn ? 'bg-blue-700 text-white rounded-tr-sm' : 'bg-slate-50 text-slate-700 rounded-tl-sm border border-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'}`}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            )}
          </div>
          
          <div className="border-t border-slate-100 dark:border-slate-800 p-4">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-600 dark:placeholder:text-slate-400"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                aria-label="Enviar mensaje"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white disabled:opacity-50 transition-transform active:scale-95 hover:bg-blue-800"
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
