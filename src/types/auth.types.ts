export interface UserProfile {
  uid: string
  nombres: string
  apellidos: string
  username: string
  email: string
  avatarUrl: string
  provider: 'email' | 'google'
  createdAt: string
}

export interface RegisterFormData {
  nombres: string
  apellidos: string
  username: string
  email: string
  password: string
  confirmPassword: string
  avatarUrl: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface GoogleAuthResult {
  uid: string
  email: string
  displayName: string
  photoUrl: string
  isNewUser: boolean
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export interface AuthState {
  user: UserProfile | null
  loading: boolean
  error: string | null
}
