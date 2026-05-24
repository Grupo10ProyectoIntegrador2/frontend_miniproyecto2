import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingGoogleData, setPendingGoogleData] = useState<GoogleAuthResult | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile)
          } else {
            setUser(null)
          }
        } catch (error) {
          console.error("Error obteniendo perfil:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const profile = await authService.loginWithEmail(email, password)
    setUser(profile)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const result = await authService.loginWithGoogle()
    if (result.isNewUser) {
      setPendingGoogleData(result)
    }
  }, [])

  const register = useCallback(async (data: RegisterFormData) => {
    const profile = await authService.registerWithEmail(data)
    setUser(profile)
  }, [])

  const completeProfile = useCallback(async (username: string) => {
    if (!pendingGoogleData) {
      throw new Error('No hay datos de Google pendientes')
    }
    const profile = await authService.completeGoogleProfile(pendingGoogleData, username)
    setPendingGoogleData(null)
    setUser(profile)
  }, [pendingGoogleData])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    setPendingGoogleData(null)
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
