import { useState, useEffect, useRef, useCallback } from 'react'
import { socket } from '../lib/socket'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function useWebRTC(roomId: string, userId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  // Utilizamos socketId como clave para los streams remotos
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)

  const startLocalStream = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error('Error accessing media devices:', error)
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

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    return pc
  }, [])

  useEffect(() => {
    if (!roomId) return

    const handleUserJoined = async (payload: { socketId: string; uid: string }) => {
      if (payload.uid === userId || !payload.socketId) return

      const pc = createPeerConnection(payload.socketId)
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
        } catch (error) {
          console.error('Error setting remote description from answer:', error)
        }
      }
    }

    const handleCandidate = async (payload: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
      if (!payload.senderSocketId || !payload.candidate) return

      const pc = peerConnections.current.get(payload.senderSocketId)
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
        } catch (error) {
          console.error('Error adding ICE candidate:', error)
        }
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
  }, [roomId, userId, createPeerConnection])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocalStream()
      peerConnections.current.forEach((pc) => pc.close())
      peerConnections.current.clear()
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
    toggleCamera
  }
}
