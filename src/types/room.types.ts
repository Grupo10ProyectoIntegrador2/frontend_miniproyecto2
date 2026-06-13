export interface Room {
  id: string
  name: string
  createdBy: string
  createdAt: string
  status: 'active' | 'inactive'
}

export interface CreateRoomResponse {
  success: boolean
  message: string
  room: Room
}

export interface RoomsListResponse {
  success: boolean
  rooms: Room[]
}

export interface JoinRoomResponse {
  success: boolean
  message: string
  room: Room
}

export interface RoomParticipant {
  uid: string
  firstName: string
  lastName: string
  username: string
  email: string
  avatarUrl: string
  provider: 'email' | 'google'
  createdAt: string
  joinedAt: string
  role: 'Administrador' | 'Participante'
}

export interface RoomParticipantsResponse {
  success: boolean
  participants: RoomParticipant[]
}

export interface UpdateRoomResponse {
  success: boolean
  message: string
  room: Room
}

export interface DeleteRoomResponse {
  success: boolean
  message: string
}