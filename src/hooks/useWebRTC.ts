import { useState, useEffect, useRef, useCallback } from 'react'
import { socket } from '../lib/socket'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function useWebRTC(
  roomId: string,
  userId: string,
  localParticipant?: any,
  onPeerMetadataReceived?: (socketId: string, uid: string, participant: any) => void
) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  // Utilizamos socketId como clave para los streams remotos
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  const remoteCandidatesQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
  const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)

  const processQueuedCandidates = useCallback(async (senderSocketId: string, pc: RTCPeerConnection) => {
    const queue = remoteCandidatesQueue.current.get(senderSocketId)
    if (queue && queue.length > 0) {
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (error) {
          console.error('Error adding queued ICE candidate:', error)
        }
      }
      remoteCandidatesQueue.current.delete(senderSocketId)
    }
  }, [])

  const setupDataChannel = useCallback((targetSocketId: string, dc: RTCDataChannel) => {
    dataChannels.current.set(targetSocketId, dc)

    dc.onopen = () => {
      console.log(`[DataChannel] Canal de metadatos abierto con ${targetSocketId}`)
      if (localParticipant) {
        dc.send(JSON.stringify({
          uid: userId,
          participant: localParticipant
        }))
      }
    }

    dc.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log(`[DataChannel] Metadatos recibidos de ${targetSocketId}:`, data)
        onPeerMetadataReceived?.(targetSocketId, data.uid, data.participant)
      } catch (error) {
        console.error('[DataChannel] Error procesando mensaje de metadatos:', error)
      }
    }

    dc.onclose = () => {
      console.log(`[DataChannel] Canal de metadatos cerrado con ${targetSocketId}`)
      dataChannels.current.delete(targetSocketId)
    }

    dc.onerror = (err) => {
      console.error(`[DataChannel] Error en canal con ${targetSocketId}:`, err)
    }

    // Si ya está abierto al asignarse
    if (dc.readyState === 'open') {
      if (localParticipant) {
        dc.send(JSON.stringify({
          uid: userId,
          participant: localParticipant
        }))
      }
    }
  }, [userId, localParticipant, onPeerMetadataReceived])

  const startLocalStream = useCallback(async () => {
    try {
      setPermissionError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      localStreamRef.current = stream
      
      // Añadir las pistas a las conexiones existentes (si las hay)
      peerConnections.current.forEach((pc) => {
        stream.getTracks().forEach((track) => {
          // Check if sender already exists
          const senders = pc.getSenders()
          const trackExists = senders.some(sender => sender.track?.id === track.id)
          if (!trackExists) {
            pc.addTrack(track, stream)
          }
        })
      })
      
      return stream
    } catch (error: any) {
      console.error('Error accessing media devices:', error)
      let msg = 'No se pudo acceder a la cámara o al micrófono.'
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        msg = 'Permiso denegado para acceder a la cámara y/o micrófono. Por favor, actívalos en la configuración de tu navegador.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        msg = 'No se encontró ninguna cámara o micrófono conectado.'
      }
      setPermissionError(msg)
      return null
    }
  }, [])

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }
  }, [])

  const createPeerConnection = useCallback((targetSocketId: string) => {
    if (peerConnections.current.has(targetSocketId)) {
      return peerConnections.current.get(targetSocketId)!
    }

    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnections.current.set(targetSocketId, pc)

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
        })
      }
    }

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => {
        const newMap = new Map(prev)
        newMap.set(targetSocketId, event.streams[0])
        return newMap
      })
    }

    pc.ondatachannel = (event) => {
      const dc = event.channel
      if (dc.label === 'metadata') {
        setupDataChannel(targetSocketId, dc)
      }
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    return pc
  }, [setupDataChannel])

  useEffect(() => {
    if (!roomId) return

    const handleUserJoined = async (payload: { socketId: string; uid: string }) => {
      if (payload.uid === userId || !payload.socketId) return

      const pc = createPeerConnection(payload.socketId)
      const dc = pc.createDataChannel('metadata')
      setupDataChannel(payload.socketId, dc)

      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('offer', {
          targetSocketId: payload.socketId,
          offer,
        })
      } catch (error) {
        console.error('Error creating offer:', error)
      }
    }

    const handleOffer = async (payload: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => {
      if (!payload.senderSocketId || !payload.offer) return
      
      const pc = createPeerConnection(payload.senderSocketId)
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('answer', {
          targetSocketId: payload.senderSocketId,
          answer,
        })
        await processQueuedCandidates(payload.senderSocketId, pc)
      } catch (error) {
        console.error('Error handling offer:', error)
      }
    }

    const handleAnswer = async (payload: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => {
      if (!payload.senderSocketId || !payload.answer) return

      const pc = peerConnections.current.get(payload.senderSocketId)
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer))
          await processQueuedCandidates(payload.senderSocketId, pc)
        } catch (error) {
          console.error('Error setting remote description from answer:', error)
        }
      }
    }

    const handleCandidate = async (payload: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
      if (!payload.senderSocketId || !payload.candidate) return

      const pc = peerConnections.current.get(payload.senderSocketId)
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
        } catch (error) {
          console.error('Error adding ICE candidate:', error)
        }
      } else {
        if (!remoteCandidatesQueue.current.has(payload.senderSocketId)) {
          remoteCandidatesQueue.current.set(payload.senderSocketId, [])
        }
        remoteCandidatesQueue.current.get(payload.senderSocketId)!.push(payload.candidate)
      }
    }

    const handleUserLeft = (payload: { socketId: string; uid: string }) => {
      if (!payload.socketId) return
      
      // Cleanup peer connection
      const pc = peerConnections.current.get(payload.socketId)
      if (pc) {
        pc.close()
        peerConnections.current.delete(payload.socketId)
      }
      
      remoteCandidatesQueue.current.delete(payload.socketId)

      // Remove from remote streams
      setRemoteStreams((prev) => {
        const newMap = new Map(prev)
        newMap.delete(payload.socketId)
        return newMap
      })
    }

    socket.on('user-joined', handleUserJoined)
    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('candidate', handleCandidate)
    socket.on('user-left', handleUserLeft)

    return () => {
      socket.off('user-joined', handleUserJoined)
      socket.off('offer', handleOffer)
      socket.off('answer', handleAnswer)
      socket.off('candidate', handleCandidate)
      socket.off('user-left', handleUserLeft)
    }
  }, [roomId, userId, createPeerConnection, processQueuedCandidates, setupDataChannel])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocalStream()
      peerConnections.current.forEach((pc) => pc.close())
      peerConnections.current.clear()
      dataChannels.current.forEach((dc) => dc.close())
      dataChannels.current.clear()
      setRemoteStreams(new Map())
    }
  }, [stopLocalStream])

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        return audioTrack.enabled
      }
    }
    return false
  }

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        return videoTrack.enabled
      }
    }
    return false
  }

  return {
    localStream,
    remoteStreams,
    startLocalStream,
    stopLocalStream,
    toggleMic,
    toggleCamera,
    permissionError
  }
}
