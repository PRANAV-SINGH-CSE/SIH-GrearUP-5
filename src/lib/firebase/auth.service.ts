'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { firebaseConfig } from './firebase.service';

function getClientFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    // Server-side stub/fallback
    const app = getClientFirebaseApp();
    return getAuth(app);
  }
  if (!authInstance) {
    const app = getClientFirebaseApp();
    authInstance = getAuth(app);
  }
  return authInstance;
}

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isInspector?: boolean;
}

export class FirebaseAuthService {
  /**
   * Sign in with Google (Popup)
   */
  static async signInWithGoogle(): Promise<User> {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  }

  /**
   * Register with Email & Password and send verification email
   */
  static async signUpWithEmail(
    email: string,
    pass: string,
    displayName: string
  ): Promise<User> {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    await sendEmailVerification(cred.user);
    return cred.user;
  }

  /**
   * Sign in with Email & Password
   */
  static async signInWithEmail(email: string, pass: string): Promise<User> {
    const auth = getFirebaseAuth();
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  }

  /**
   * Resend verification email
   */
  static async sendVerificationEmail(user: User): Promise<void> {
    await sendEmailVerification(user);
  }

  /**
   * Refresh user info to check if email was verified
   */
  static async reloadUser(user: User): Promise<User> {
    await user.reload();
    const auth = getFirebaseAuth();
    return auth.currentUser || user;
  }

  /**
   * Sign Out
   */
  static async signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    await signOut(auth);
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, callback);
  }
}
