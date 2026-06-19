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


export interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  pendingGoogleData: GoogleAuthResult | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (data: RegisterFormData) => Promise<void>
  completeProfile: (username: string) => Promise<void>
  logout: () => Promise<void>
  clearPendingGoogle: () => void
  updateProfile: (data: {
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl: string;
    email?: string;
  }) => Promise<void>
  deleteAccount: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingGoogleData, setPendingGoogleData] = useState<GoogleAuthResult | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
          
          const idToken = await firebaseUser.getIdToken();
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ uid: firebaseUser.uid }),
          });
          
          if (response.ok) {
            const data = await response.json() as { success: boolean; user: UserProfile };
            if (data.user) {
              setUser(data.user);
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error obteniendo perfil:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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

  const updateProfile = useCallback(async (data: {
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl: string;
    email?: string;
  }) => {
    if (!user) throw new Error('No hay usuario autenticado')
    await authService.updateUserProfile(user.uid, data)
    setUser((prevUser) => {
      if (!prevUser) return null
      return {
        ...prevUser,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username.toLowerCase(),
        avatarUrl: data.avatarUrl,
        ...(data.email ? { email: data.email.toLowerCase() } : {}),
      }
    })
  }, [user])

  const deleteAccount = useCallback(async () => {
    if (!user) throw new Error('No hay usuario autenticado')
    await authService.deleteUserProfile(user.uid)
    await authService.logout()
    setUser(null)
    setPendingGoogleData(null)
  }, [user])

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
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
