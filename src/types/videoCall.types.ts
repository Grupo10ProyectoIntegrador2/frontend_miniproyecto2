import type { RoomParticipant } from './room.types'

export interface VideoCallStatus {
  roomId: string
  active: boolean
  count: number
  uids: string[]
  participants: RoomParticipant[]
}

export interface RoomPresenceUser {
  socketId: string
  uid: string
  participant?: RoomParticipant
}

export interface RoomPresencePayload {
  roomId: string
  users: RoomPresenceUser[]
}
