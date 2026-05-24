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

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username.toLowerCase()));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
}

export async function registerWithEmail(data: RegisterFormData): Promise<UserProfile> {
  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  
  const profile: UserProfile = {
    uid: userCredential.user.uid,
    nombres: data.nombres,
    apellidos: data.apellidos,
    username: data.username.toLowerCase(),
    email: data.email,
    avatarUrl: data.avatarUrl || '',
    provider: 'email',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', userCredential.user.uid), profile);
  return profile;
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
  
  if (!userDoc.exists()) {
    throw new Error('Perfil de usuario no encontrado en la base de datos');
  }
  
  return userDoc.data() as UserProfile;
}

export async function loginWithGoogle(): Promise<GoogleAuthResult> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const { user } = userCredential;
  
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoUrl: user.photoURL || '',
    isNewUser: !userDoc.exists(),
  };
}

export async function completeGoogleProfile(
  googleData: GoogleAuthResult,
  username: string
): Promise<UserProfile> {
  const nameParts = googleData.displayName.split(' ');
  const profile: UserProfile = {
    uid: googleData.uid,
    nombres: nameParts[0] || '',
    apellidos: nameParts.slice(1).join(' ') || '',
    username: username.toLowerCase(),
    email: googleData.email,
    avatarUrl: googleData.photoUrl,
    provider: 'google',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', googleData.uid), profile);
  return profile;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}
