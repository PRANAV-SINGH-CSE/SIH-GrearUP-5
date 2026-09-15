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
const COOKIE_CACHE_KEY = 'compliscan_auth_session';
const USER_SCANS_PREFIX = 'compliscan_cached_scans_v1_';
const EXPLICIT_LOGOUT_KEY = 'compliscan_explicit_logout_flag';

// 1 Year cookie duration for mobile browsers and standalone webviews
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/**
 * Cookie Helper Functions (Persists across mobile browser swipe-close & webviews)
 */
function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  try {
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
  } catch (err) {
    console.warn('Failed to set cookie:', err);
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const matches = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`));
    return matches ? decodeURIComponent(matches[1]) : null;
  } catch (err) {
    console.warn('Failed to read cookie:', err);
    return null;
  }
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  } catch (err) {
    console.warn('Failed to delete cookie:', err);
  }
}

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
   * Save user details across localStorage, sessionStorage, AND long-lived cookie
   * to survive mobile phone app restarts, browser closes, and PWA memory purges.
   */
  static saveUser(user: User | null, token?: string): void {
    if (typeof window === 'undefined') return;
    if (!user || !user.uid) return;

    try {
      const existing = this.getCachedProfile();
      const profile: CachedUserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified ?? true,
        cachedAt: existing?.cachedAt || Date.now(),
        lastActive: Date.now(),
        accessToken: token || existing?.accessToken,
      };

      const serialized = JSON.stringify(profile);

      // 1. Primary: localStorage
      try {
        window.localStorage.setItem(USER_CACHE_KEY, serialized);
        window.localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
      } catch (lsErr) {
        console.warn('localStorage write warning:', lsErr);
      }

      // 2. Secondary: sessionStorage
      try {
        window.sessionStorage.setItem(USER_CACHE_KEY, serialized);
      } catch {}

      // 3. Persistent Mobile Fallback: 1-Year Cookie
      setCookie(COOKIE_CACHE_KEY, serialized, COOKIE_MAX_AGE);
      deleteCookie(EXPLICIT_LOGOUT_KEY);
    } catch (err) {
      console.warn('Failed to save user to cache:', err);
    }
  }

  /**
   * Get cached user profile data with multi-layer fallback and self-healing
   */
  static getCachedProfile(): CachedUserProfile | null {
    if (typeof window === 'undefined') return null;

    try {
      // 1. Check if user explicitly clicked Sign Out
      const isExplicitOut =
        window.localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true' ||
        getCookie(EXPLICIT_LOGOUT_KEY) === 'true';

      if (isExplicitOut) {
        return null;
      }

      let raw: string | null = null;

      // Check localStorage
      try {
        raw = window.localStorage.getItem(USER_CACHE_KEY);
      } catch {}

      // Fallback to cookie if localStorage was cleared on mobile app close
      if (!raw) {
        raw = getCookie(COOKIE_CACHE_KEY);
        // Self-heal: restore into localStorage
        if (raw) {
          try {
            window.localStorage.setItem(USER_CACHE_KEY, raw);
          } catch {}
        }
      }

      // Fallback to sessionStorage
      if (!raw) {
        try {
          raw = window.sessionStorage.getItem(USER_CACHE_KEY);
        } catch {}
      }

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
   * Get cached user proxy for instant app hydration (0ms delay)
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
      return (
        window.localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true' ||
        getCookie(EXPLICIT_LOGOUT_KEY) === 'true'
      );
    } catch {
      return false;
    }
  }

  /**
   * Clear user credentials from all storage layers upon explicit Sign Out
   */
  static clear(): void {
    if (typeof window === 'undefined') return;

    try {
      // Mark explicit logout flag
      try {
        window.localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
        window.localStorage.removeItem(USER_CACHE_KEY);
      } catch {}

      try {
        window.sessionStorage.removeItem(USER_CACHE_KEY);
      } catch {}

      deleteCookie(COOKIE_CACHE_KEY);
      setCookie(EXPLICIT_LOGOUT_KEY, 'true', 30 * 24 * 60 * 60);
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
