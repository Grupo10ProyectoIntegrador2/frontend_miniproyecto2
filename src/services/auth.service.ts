import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { UserProfile, RegisterFormData, GoogleAuthResult } from '../types/auth.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function mapFirebaseAuthError(error: unknown, fallbackMessage: string): Error {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : ''

  switch (code) {
    case 'auth/email-already-in-use':
      return new Error('Ese correo ya está registrado. Por favor usa otro.')
    case 'auth/popup-closed-by-user':
      return new Error('Cerraste la ventana de Google antes de completar el proceso.')
    case 'auth/popup-blocked':
      return new Error('El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.')
    case 'auth/cancelled-popup-request':
      return new Error('Se canceló el inicio con Google.')
    default:
      return error instanceof Error ? error : new Error(fallbackMessage)
  }
}

// Función auxiliar para llamar al backend
async function callBackendAPI<T>(
  endpoint: string,
  body: any,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API error');
  }

  return response.json();
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  try {
    const response = await callBackendAPI<{ available: boolean }>(
      '/auth/check-username',
      { username }
    );
    return response.available;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

export async function registerWithEmail(data: RegisterFormData): Promise<UserProfile> {
  // ── Validación previa del dominio institucional ──────────────────────────
  // Esto evita que Firebase Auth cree el usuario antes de que el backend lo rechace.
  const domain = data.email.split('@')[1] ?? ''
  const eduRegex = /\.edu(\.[a-z]{2,})?$/i
  if (!eduRegex.test(domain)) {
    throw new Error(
      'Solo se aceptan correos institucionales con dominio .edu (por ejemplo: usc.edu.co, correounivalle.edu.co, uao.edu.es).'
    )
  }

  // ── Crear usuario en Firebase Auth ───────────────────────────────────────
  let userCredential
  try {
    userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
  } catch (error) {
    throw mapFirebaseAuthError(error, 'No se pudo crear la cuenta')
  }

  // ── Llamar al backend para guardar el perfil en Firestore ────────────────
  // Si el backend rechaza (email/username duplicado, validación, etc.) debemos
  // borrar el usuario recién creado en Firebase Auth para no dejarlo huérfano.
  try {
    await callBackendAPI(
      '/auth/register',
      {
        uid: userCredential.user.uid,
        firstName: data.nombres,
        lastName: data.apellidos,
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        avatarUrl: data.avatarUrl || '',
        provider: 'email',
      }
    );
  } catch (backendError) {
    // Eliminar el usuario de Firebase Auth para mantener consistencia
    try {
      await deleteUser(userCredential.user);
    } catch (deleteErr) {
      console.error('No se pudo eliminar el usuario de Firebase Auth tras error de backend:', deleteErr);
    }
    throw backendError;
  }

  //retornar el perfil al frontend
  const profile: UserProfile = {
    uid: userCredential.user.uid,
    firstName: data.nombres,
    lastName: data.apellidos,
    username: data.username.toLowerCase(),
    email: data.email,
    avatarUrl: data.avatarUrl || '',
    provider: 'email',
    createdAt: new Date().toISOString(),
  };

  return profile;
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  // autenticar en Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  // llamar al backend para obtener el perfil
  const response = await callBackendAPI<{ success: boolean; user: UserProfile }>(
    '/auth/login',
    { uid: userCredential.user.uid }
  );

  if (!response.success) {
    throw new Error('Profile not found');
  }

  return response.user;
}

export async function loginWithGoogle(): Promise<GoogleAuthResult> {
  const provider = new GoogleAuthProvider();
  let userCredential
  try {
    userCredential = await signInWithPopup(auth, provider)
  } catch (error) {
    throw mapFirebaseAuthError(error, 'Error con la autenticación de Google')
  }
  const { user } = userCredential;

  // Validación del dominio para Google
  const email = user.email || '';
  const domain = email.split('@')[1] ?? '';
  const eduRegex = /\.edu(\.[a-z]{2,})?$/i;

  if (!eduRegex.test(domain)) {
    // Si no es institucional, eliminamos el usuario de Firebase Auth inmediatamente
    await deleteUser(user);
    throw new Error(
      'Solo se aceptan correos institucionales con dominio .edu (por ejemplo: usc.edu.co, correounivalle.edu.co, uao.edu.es).'
    );
  }

  // Llamar al backend para verificar si es nuevo usuario
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid }),
    });

    const data = await response.json();

    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoUrl: user.photoURL || '',
      isNewUser: !data.user, // Si no hay usuario, es nuevo
    };
  } catch (error) {
    console.error('Error checking user:', error);
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoUrl: user.photoURL || '',
      isNewUser: true,
    };
  }
}

export async function completeGoogleProfile(
  googleData: GoogleAuthResult,
  username: string
): Promise<UserProfile> {
  const nameParts = googleData.displayName.split(' ');

  // Llamar al backend para completar perfil
  await callBackendAPI(
    '/auth/complete-profile',
    {
      uid: googleData.uid,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      username: username.toLowerCase(),
      email: googleData.email.toLowerCase(),
      avatarUrl: googleData.photoUrl,
    }
  );

  // Retornar el perfil
  const profile: UserProfile = {
    uid: googleData.uid,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    username: username.toLowerCase(),
    email: googleData.email.toLowerCase(),
    avatarUrl: googleData.photoUrl,
    provider: 'google',
    createdAt: new Date().toISOString(),
  };

  return profile;
}

export async function checkEmailAvailable(email: string): Promise<boolean> {
  try {
    const response = await callBackendAPI<{ available: boolean }>(
      '/auth/check-email',
      { email }
    );
    return response.available;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
}

export async function updateUserProfile(
  uid: string,
  data: {
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl: string;
    email?: string;
  }
): Promise<{ success: boolean; message: string }> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(`${API_BASE_URL}/auth/profile/${uid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar el perfil');
  }

  return response.json();
}

export async function deleteUserProfile(uid: string): Promise<{ success: boolean; message: string }> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(`${API_BASE_URL}/auth/profile/${uid}`, {
    method: 'DELETE',
    headers: {
      ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al eliminar la cuenta');
  }

  return response.json();
}

export async function logout(): Promise<void> {
  await signOut(auth);
}
