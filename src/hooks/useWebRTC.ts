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
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const [peerSocketIds, setPeerSocketIds] = useState<Set<string>>(new Set())
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  const remoteCandidatesQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
  const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)

  // ── Perfect Negotiation state ──────────────────────────────────────
  const makingOffer = useRef<Map<string, boolean>>(new Map())
  const ignoreOffer = useRef<Map<string, boolean>>(new Map())

  // ── Refs to hold latest values for stable closures ──────────────────
  const localParticipantRef = useRef(localParticipant)
  localParticipantRef.current = localParticipant

  const userIdRef = useRef(userId)
  userIdRef.current = userId

  const onPeerMetadataReceivedRef = useRef(onPeerMetadataReceived)
  onPeerMetadataReceivedRef.current = onPeerMetadataReceived


  const isPolite = useCallback((targetSocketId: string): boolean => {
    return (socket.id ?? '') < targetSocketId
  }, [])

  // ── Process queued ICE candidates ──────────────────────────────────
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

  // ── Setup DataChannel – reads from refs so closure stays fresh ─────
  const setupDataChannel = useCallback((targetSocketId: string, dc: RTCDataChannel) => {
    dataChannels.current.set(targetSocketId, dc)

    dc.onopen = () => {
      console.log(`[DataChannel] Canal de metadatos abierto con ${targetSocketId}`)
      const participant = localParticipantRef.current
      if (participant) {
        dc.send(JSON.stringify({
          uid: userIdRef.current,
          participant
        }))
      }
    }

    dc.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log(`[DataChannel] Metadatos recibidos de ${targetSocketId}:`, data)
        onPeerMetadataReceivedRef.current?.(targetSocketId, data.uid, data.participant)
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

    // If already open when assigned
    if (dc.readyState === 'open') {
      const participant = localParticipantRef.current
      if (participant) {
        dc.send(JSON.stringify({
          uid: userIdRef.current,
          participant
        }))
      }
    }
  }, []) // No deps needed – reads from refs

  // ── Media stream management ────────────────────────────────────────
  const startLocalStream = useCallback(async () => {
    try {
      setPermissionError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      localStreamRef.current = stream
      
      // Add tracks to existing peer connections (if any)
      // onnegotiationneeded will fire automatically and handle renegotiation
      peerConnections.current.forEach((pc) => {
        stream.getTracks().forEach((track) => {
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

  // ── Create peer connection – Perfect Negotiation pattern ───────────
  const createPeerConnection = useCallback((targetSocketId: string) => {
    if (peerConnections.current.has(targetSocketId)) {
      return peerConnections.current.get(targetSocketId)!
    }

    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnections.current.set(targetSocketId, pc)
    makingOffer.current.set(targetSocketId, false)
    ignoreOffer.current.set(targetSocketId, false)

    // Track peer for grid rendering
    setPeerSocketIds(prev => {
      const next = new Set(prev)
      next.add(targetSocketId)
      return next
    })

    // ICE connection monitoring
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${targetSocketId}: ${pc.iceConnectionState}`)
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[WebRTC] ICE failed with ${targetSocketId}, attempting restart`)
        pc.restartIce()
      }
    }
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${targetSocketId}: ${pc.connectionState}`)
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    pc.onnegotiationneeded = async () => {
      try {
        console.log(`[WebRTC] Negotiation needed with ${targetSocketId} (signalingState: ${pc.signalingState})`)
        makingOffer.current.set(targetSocketId, true)
        await pc.setLocalDescription()
        socket.emit('offer', {
          targetSocketId,
          offer: pc.localDescription,
        })
        console.log(`[WebRTC] Offer sent to ${targetSocketId}`)
      } catch (error) {
        console.error(`[WebRTC] Error during renegotiation with ${targetSocketId}:`, error)
      } finally {
        makingOffer.current.set(targetSocketId, false)
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
        })
      }
    }

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Track received from ${targetSocketId}: kind=${event.track.kind}, readyState=${event.track.readyState}`)
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

    return pc
  }, [setupDataChannel]) // setupDataChannel is now stable (no deps)

  // ── Socket event listeners – runs only once per roomId ─────────────
  useEffect(() => {
    if (!roomId) return

    const handleUserJoined = async (payload: { socketId: string; uid: string }) => {
      if (payload.socketId === socket.id || !payload.socketId) return
      console.log(`[WebRTC] User joined: ${payload.socketId}`)

      const pc = createPeerConnection(payload.socketId)

      // Creating the DataChannel triggers onnegotiationneeded → offer
      const dc = pc.createDataChannel('metadata')
      setupDataChannel(payload.socketId, dc)
    }

    // ── handleOffer: Perfect Negotiation collision handling ───────────
    const handleOffer = async (payload: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => {
      if (!payload.senderSocketId || !payload.offer) return
      console.log(`[WebRTC] Offer received from ${payload.senderSocketId}`)

      const pc = createPeerConnection(payload.senderSocketId)
      const polite = isPolite(payload.senderSocketId)

      const offerCollision =
        makingOffer.current.get(payload.senderSocketId) ||
        pc.signalingState !== 'stable'
        
      const shouldIgnore = !polite && offerCollision
      ignoreOffer.current.set(payload.senderSocketId, shouldIgnore)

      if (shouldIgnore) {
        console.log(`[WebRTC] Ignoring colliding offer from ${payload.senderSocketId} (impolite peer)`)
        return
      }

      try {
        // Polite peer rolls back its own offer if there's a collision
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
        await pc.setLocalDescription()
        socket.emit('answer', {
          targetSocketId: payload.senderSocketId,
          answer: pc.localDescription,
        })
        console.log(`[WebRTC] Answer sent to ${payload.senderSocketId}`)
        await processQueuedCandidates(payload.senderSocketId, pc)
      } catch (error) {
        console.error('Error handling offer:', error)
      }
    }

    // ── handleAnswer: guard with signaling state ─────────────────────
    const handleAnswer = async (payload: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => {
      if (!payload.senderSocketId || !payload.answer) return

      const pc = peerConnections.current.get(payload.senderSocketId)
      if (!pc) return

      // Only accept answers when we're expecting one
      if (pc.signalingState !== 'have-local-offer') {
        console.warn(`[WebRTC] Ignoring answer from ${payload.senderSocketId} – unexpected state: ${pc.signalingState}`)
        return
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer))
        console.log(`[WebRTC] Answer set from ${payload.senderSocketId}`)
        await processQueuedCandidates(payload.senderSocketId, pc)
      } catch (error) {
        console.error('Error setting remote description from answer:', error)
      }
    }

    const handleCandidate = async (payload: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
      if (!payload.senderSocketId || !payload.candidate) return

      const pc = peerConnections.current.get(payload.senderSocketId)
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
        } catch (error) {
          // Ignore candidates for offers we've decided to ignore
          if (!ignoreOffer.current.get(payload.senderSocketId)) {
            console.error('Error adding ICE candidate:', error)
          }
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
      console.log(`[WebRTC] User left: ${payload.socketId}`)
      
      const pc = peerConnections.current.get(payload.socketId)
      if (pc) {
        pc.close()
        peerConnections.current.delete(payload.socketId)
      }
      
      // Clean up Perfect Negotiation state
      makingOffer.current.delete(payload.socketId)
      ignoreOffer.current.delete(payload.socketId)

      dataChannels.current.get(payload.socketId)?.close()
      dataChannels.current.delete(payload.socketId)
      remoteCandidatesQueue.current.delete(payload.socketId)

      setPeerSocketIds(prev => {
        const next = new Set(prev)
        next.delete(payload.socketId)
        return next
      })

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
  }, [roomId, createPeerConnection, setupDataChannel, processQueuedCandidates, isPolite])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocalStream()
      peerConnections.current.forEach((pc) => pc.close())
      peerConnections.current.clear()
      dataChannels.current.forEach((dc) => dc.close())
      dataChannels.current.clear()
      makingOffer.current.clear()
      ignoreOffer.current.clear()
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
    peerSocketIds,
    startLocalStream,
    stopLocalStream,
    toggleMic,
    toggleCamera,
    permissionError
  }
}
