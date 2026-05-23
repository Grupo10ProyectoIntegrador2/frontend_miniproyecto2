import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  UserProfile,
  RegisterFormData,
  GoogleAuthResult,
} from '../types/auth.types'
import * as authService from '../services/auth.service'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  pendingGoogleData: GoogleAuthResult | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (data: RegisterFormData) => Promise<void>
  completeProfile: (username: string) => Promise<void>
  logout: () => Promise<void>
  clearPendingGoogle: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'salon_auth_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingGoogleData, setPendingGoogleData] = useState<GoogleAuthResult | null>(null)

  // Restaurar sesion desde localStorage al montar.
  // Con Firebase esto se reemplaza por onAuthStateChanged.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  const persistUser = useCallback((profile: UserProfile) => {
    setUser(profile)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const profile = await authService.loginWithEmail(email, password)
    persistUser(profile)
  }, [persistUser])

  const loginWithGoogle = useCallback(async () => {
    const result = await authService.loginWithGoogle()
    if (result.isNewUser) {
      setPendingGoogleData(result)
    } else {
      // Usuario recurrente, ya tiene perfil completo
      const profile: UserProfile = {
        uid: result.uid,
        nombres: result.displayName.split(' ')[0] || '',
        apellidos: result.displayName.split(' ').slice(1).join(' ') || '',
        username: '',
        email: result.email,
        avatarUrl: result.photoUrl,
        provider: 'google',
        createdAt: new Date().toISOString(),
      }
      persistUser(profile)
    }
  }, [persistUser])

  const register = useCallback(async (data: RegisterFormData) => {
    const profile = await authService.registerWithEmail(data)
    persistUser(profile)
  }, [persistUser])

  const completeProfile = useCallback(async (username: string) => {
    if (!pendingGoogleData) {
      throw new Error('No hay datos de Google pendientes')
    }
    const profile = await authService.completeGoogleProfile(pendingGoogleData, username)
    setPendingGoogleData(null)
    persistUser(profile)
  }, [pendingGoogleData, persistUser])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    setPendingGoogleData(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const clearPendingGoogle = useCallback(() => {
    setPendingGoogleData(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pendingGoogleData,
        login,
        loginWithGoogle,
        register,
        completeProfile,
        logout,
        clearPendingGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
