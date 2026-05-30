import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile, RegisterFormData, GoogleAuthResult } from '../types/auth.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
  //crear usuario en Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  
  // lamar al backend para guardar perfil
  await callBackendAPI(
    '/auth/register',
    {
      uid: userCredential.user.uid,
      firstName: data.nombres,
      lastName: data.apellidos,
      username: data.username,
      email: data.email,
      avatarUrl: data.avatarUrl || '',
      provider: 'email',
    }
  );

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
  const userCredential = await signInWithPopup(auth, provider);
  const { user } = userCredential;
  
  // Llamar al backend para verificar si es nuevo usuario
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
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
      username,
      email: googleData.email,
      avatarUrl: googleData.photoUrl,
    }
  );

  // Retornar el perfil
  const profile: UserProfile = {
    uid: googleData.uid,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    username: username.toLowerCase(),
    email: googleData.email,
    avatarUrl: googleData.photoUrl,
    provider: 'google',
    createdAt: new Date().toISOString(),
  };

  return profile;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}
