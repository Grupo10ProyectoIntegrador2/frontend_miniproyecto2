/**
 * Servicio de autenticacion.
 *
 * Todas las funciones simulan latencia de red y respuestas reales.
 * Para conectar con Firebase, reemplazar el cuerpo de cada funcion
 * con la llamada correspondiente al SDK (indicada en cada bloque).
 */

import type { UserProfile, RegisterFormData, GoogleAuthResult } from '../types/auth.types'

const SIMULATED_DELAY = 800

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Usernames reservados para simular colisiones
const TAKEN_USERNAMES = ['admin', 'test', 'usuario1', 'moderador']

// Cuentas "existentes" para simular login
const MOCK_ACCOUNTS: Record<string, { password: string; profile: UserProfile }> = {
  'demo@universidad.edu': {
    password: 'Demo1234',
    profile: {
      uid: 'mock-uid-001',
      nombres: 'Carlos',
      apellidos: 'Martinez',
      username: 'carlosm',
      email: 'demo@universidad.edu',
      avatarUrl: '/avatars/avatar-1.svg',
      provider: 'email',
      createdAt: new Date().toISOString(),
    },
  },
}

/**
 * Verifica si un username ya esta en uso.
 *
 * Firebase: query a Firestore collection('users').where('username', '==', username)
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  await delay(400)
  return !TAKEN_USERNAMES.includes(username.toLowerCase())
}

/**
 * Registra un usuario con correo y contrasena.
 *
 * Firebase:
 *   1. createUserWithEmailAndPassword(auth, email, password)
 *   2. setDoc(doc(db, 'users', uid), profileData)
 */
export async function registerWithEmail(data: RegisterFormData): Promise<UserProfile> {
  await delay(SIMULATED_DELAY)

  // Simular error de correo ya registrado
  if (MOCK_ACCOUNTS[data.email]) {
    throw new Error('Este correo ya esta registrado')
  }

  const uid = `uid-${Date.now()}`
  const profile: UserProfile = {
    uid,
    nombres: data.nombres,
    apellidos: data.apellidos,
    username: data.username,
    email: data.email,
    avatarUrl: data.avatarUrl,
    provider: 'email',
    createdAt: new Date().toISOString(),
  }

  // Guardar en mock para que el login funcione en la misma sesion
  MOCK_ACCOUNTS[data.email] = { password: data.password, profile }
  TAKEN_USERNAMES.push(data.username.toLowerCase())

  return profile
}

/**
 * Inicia sesion con correo y contrasena.
 *
 * Firebase: signInWithEmailAndPassword(auth, email, password)
 */
export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  await delay(SIMULATED_DELAY)

  const account = MOCK_ACCOUNTS[email]
  if (!account) {
    throw new Error('Correo no registrado')
  }
  if (account.password !== password) {
    throw new Error('Contrasena incorrecta')
  }

  return account.profile
}

/**
 * Inicia sesion con Google.
 *
 * Firebase:
 *   1. signInWithPopup(auth, googleProvider)
 *   2. Verificar si el uid existe en Firestore para determinar isNewUser
 */
export async function loginWithGoogle(): Promise<GoogleAuthResult> {
  await delay(SIMULATED_DELAY)

  // Simula los datos que devuelve el popup de Google
  return {
    uid: `google-uid-${Date.now()}`,
    email: 'google.user@gmail.com',
    displayName: 'Ana Lopez',
    photoUrl: '/avatars/avatar-3.svg',
    isNewUser: true,
  }
}

/**
 * Completa el perfil de un usuario de Google asignandole un username.
 *
 * Firebase: setDoc(doc(db, 'users', uid), profileData)
 */
export async function completeGoogleProfile(
  googleData: GoogleAuthResult,
  username: string
): Promise<UserProfile> {
  await delay(SIMULATED_DELAY)

  const nameParts = googleData.displayName.split(' ')
  const profile: UserProfile = {
    uid: googleData.uid,
    nombres: nameParts[0] || '',
    apellidos: nameParts.slice(1).join(' ') || '',
    username,
    email: googleData.email,
    avatarUrl: googleData.photoUrl,
    provider: 'google',
    createdAt: new Date().toISOString(),
  }

  TAKEN_USERNAMES.push(username.toLowerCase())
  MOCK_ACCOUNTS[googleData.email] = { password: '', profile }

  return profile
}

/**
 * Cierra la sesion del usuario.
 *
 * Firebase: signOut(auth)
 */
export async function logout(): Promise<void> {
  await delay(300)
}
