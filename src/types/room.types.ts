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
