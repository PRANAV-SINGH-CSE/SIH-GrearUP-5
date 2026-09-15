'use client';

import { User } from 'firebase/auth';
import { AppScanItem } from '../mock-scans';

export interface CachedUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  cachedAt: number;
  lastActive: number;
  accessToken?: string;
}

const USER_CACHE_KEY = 'compliscan_cached_auth_user_v1';
const USER_SCANS_PREFIX = 'compliscan_cached_scans_v1_';
const EXPLICIT_LOGOUT_KEY = 'compliscan_explicit_logout_flag';

/**
 * Creates a Duck-typed User object from cached data so components expecting
 * a Firebase User (with uid, email, displayName, photoURL, emailVerified, reload, getIdToken)
 * continue to work smoothly even before Firebase Auth finishes async initialization.
 */
export function createCachedUserProxy(profile: CachedUserProfile): User {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    emailVerified: profile.emailVerified,
    isAnonymous: false,
    metadata: {
      creationTime: new Date(profile.cachedAt).toUTCString(),
      lastSignInTime: new Date(profile.lastActive).toUTCString(),
    },
    providerData: [],
    refreshToken: '',
    tenantId: null,
    phoneNumber: null,
    providerId: 'firebase',
    delete: async () => {},
    getIdToken: async () => profile.accessToken || '',
    getIdTokenResult: async () => ({
      token: profile.accessToken || '',
      authTime: new Date(profile.lastActive).toISOString(),
      issuedAtTime: new Date(profile.lastActive).toISOString(),
      expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
      signInProvider: 'password',
      signInSecondFactor: null,
      claims: {},
    }),
    reload: async () => {},
    toJSON: () => profile,
  } as unknown as User;
}

export class AuthCacheService {
  /**
   * Save user details to mobile/browser localStorage cache
   */
  static saveUser(user: User | null, token?: string): void {
    if (typeof window === 'undefined') return;

    if (!user) {
      return;
    }

    try {
      const existing = this.getCachedProfile();
      const profile: CachedUserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        cachedAt: existing?.cachedAt || Date.now(),
        lastActive: Date.now(),
        accessToken: token || existing?.accessToken,
      };

      window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile));
      window.localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
    } catch (err) {
      console.warn('Failed to save user to cache:', err);
    }
  }

  /**
   * Get cached user profile data
   */
  static getCachedProfile(): CachedUserProfile | null {
    if (typeof window === 'undefined') return null;

    try {
      // Check if user explicitly signed out
      const isLoggedOut = window.localStorage.getItem(EXPLICIT_LOGOUT_KEY);
      if (isLoggedOut === 'true') {
        return null;
      }

      const raw = window.localStorage.getItem(USER_CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as CachedUserProfile;
      if (!parsed || !parsed.uid) return null;

      return parsed;
    } catch (err) {
      console.warn('Failed to read cached user profile:', err);
      return null;
    }
  }

  /**
   * Get cached user proxy for instant app hydration
   */
  static getCachedUser(): User | null {
    const profile = this.getCachedProfile();
    if (!profile) return null;
    return createCachedUserProxy(profile);
  }

  /**
   * Check whether user explicitly signed out
   */
  static isExplicitlyLoggedOut(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Clear user credentials and flag explicit sign out
   */
  static clear(): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
      window.localStorage.removeItem(USER_CACHE_KEY);
    } catch (err) {
      console.warn('Failed to clear user cache:', err);
    }
  }

  /**
   * Save user scans to local mobile cache so history displays instantly
   */
  static saveScans(userId: string, scans: AppScanItem[]): void {
    if (typeof window === 'undefined' || !userId) return;

    try {
      const key = `${USER_SCANS_PREFIX}${userId}`;
      // Cache up to 100 recent scans locally
      const toCache = scans.slice(0, 100);
      window.localStorage.setItem(key, JSON.stringify(toCache));
    } catch (err) {
      console.warn('Failed to cache user scans:', err);
    }
  }

  /**
   * Get cached scans for immediate display
   */
  static getCachedScans(userId: string): AppScanItem[] {
    if (typeof window === 'undefined' || !userId) return [];

    try {
      const key = `${USER_SCANS_PREFIX}${userId}`;
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Failed to read cached user scans:', err);
      return [];
    }
  }

  /**
   * Clear cached scans for user
   */
  static clearUserScans(userId: string): void {
    if (typeof window === 'undefined' || !userId) return;
    try {
      const key = `${USER_SCANS_PREFIX}${userId}`;
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn('Failed to clear cached scans:', err);
    }
  }
}
