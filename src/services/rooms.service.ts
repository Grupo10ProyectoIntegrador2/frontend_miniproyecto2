import { auth } from '../lib/firebase'
import { type CreateRoomResponse, type JoinRoomResponse, type Room, type RoomParticipantsResponse, type RoomsListResponse, type RoomParticipant, type DeleteRoomResponse } from '../types/room.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

async function getAuthHeaders(): Promise<HeadersInit> {
  const idToken = await auth.currentUser?.getIdToken()
  return {
    'Content-Type': 'application/json',
    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Error en la solicitud')
  }
  return response.json()
}

export async function createRoom(name: string): Promise<Room> {
  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ name: name.trim() }),
  })
  const data = await handleResponse<CreateRoomResponse>(response)
  return data.room
}

export async function getJoinedRooms(): Promise<Room[]> {
  const response = await fetch(`${API_BASE_URL}/rooms/joined`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  })
  const data = await handleResponse<RoomsListResponse>(response)
  return data.rooms
}

export async function joinRoom(roomId: string): Promise<Room> {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/join`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  })
  const data = await handleResponse<JoinRoomResponse>(response)
  return data.room
}

export async function getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/participants`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  })
  const data = await handleResponse<RoomParticipantsResponse>(response)
  return data.participants
}

export async function updateRoom(roomId: string, name: string): Promise<Room> {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ name: name.trim() }),
  })
  const data = await handleResponse<CreateRoomResponse>(response)
  return data.room
}

export async function deleteRoom(roomId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  await handleResponse<DeleteRoomResponse>(response)
}