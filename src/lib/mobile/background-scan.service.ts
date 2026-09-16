/**
 * CompliScan Resilient Background Scan Service
 *
 * Handles mobile network drops, screen-off suspensions, and app minimize events:
 * 1. Tracks in-flight scan sessions in localStorage so unfinished scans can be recovered even if the app reloads.
 * 2. If fetch fails due to screen lock or background suspension, waits for app foreground / online reconnect.
 * 3. Checks the server (via offlineClientId) BEFORE re-uploading, retrieving already-processed results instantly.
 * 4. Retries transparently with exponential backoff rather than throwing an immediate failure.
 */

export interface ActiveScanSession {
  offlineClientId: string;
  startedAt: number;
  productNameHint?: string;
}

export interface ReconnectStatus {
  isReconnecting: boolean;
  message?: string;
  attempt?: number;
}

const ACTIVE_SCAN_STORAGE_KEY = 'compliscan_active_background_scan';

export class BackgroundScanService {
  /**
   * Persist current in-flight scan so it survives phone reloads or OS app kills
   */
  static saveActiveSession(session: ActiveScanSession): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(ACTIVE_SCAN_STORAGE_KEY, JSON.stringify(session));
    } catch (_) {}
  }

  /**
   * Retrieve active session if started within the last 8 minutes
   */
  static getActiveSession(): ActiveScanSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(ACTIVE_SCAN_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ActiveScanSession;
      const MAX_AGE_MS = 8 * 60 * 1000;
      if (Date.now() - parsed.startedAt > MAX_AGE_MS) {
        this.clearActiveSession();
        return null;
      }
      return parsed;
    } catch (_) {
      return null;
    }
  }

  /**
   * Clear active session upon successful completion or explicit cancellation
   */
  static clearActiveSession(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(ACTIVE_SCAN_STORAGE_KEY);
    } catch (_) {}
  }

  /**
   * Wait until the phone screen is turned back on / app becomes visible or network reconnects
   */
  static waitForForegroundOrOnline(maxWaitMs = 60000): Promise<void> {
    return new Promise((resolve) => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        resolve();
        return;
      }

      let timer: any = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('online', onOnline);
      };

      const onVisible = () => {
        if (document.visibilityState === 'visible') {
          cleanup();
          resolve();
        }
      };

      const onOnline = () => {
        cleanup();
        resolve();
      };

      timer = setTimeout(() => {
        cleanup();
        resolve();
      }, maxWaitMs);

      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('online', onOnline);
    });
  }

  /**
   * Check if the server has already completed the scan for a given offlineClientId
   */
  static async checkCompletedScan(offlineClientId: string): Promise<any | null> {
    try {
      const res = await fetch(`/api/scans?offlineClientId=${encodeURIComponent(offlineClientId)}`, {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success && json.data && json.data.report) {
        return json.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Execute scan request with automatic background recovery, server polling, and exponential backoff
   */
  static async executeScanWithRecovery(
    formData: FormData,
    offlineClientId: string,
    onStatusChange?: (status: ReconnectStatus) => void
  ): Promise<any> {
    const maxAttempts = 4;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        // If document is in background (phone screen off / minimized), wait for user to wake up
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          onStatusChange?.({
            isReconnecting: true,
            message: 'App is in background. Resuming scan when active...',
            attempt,
          });
          await this.waitForForegroundOrOnline(30000);
        }

        // On retry attempts, always check if server already finished processing while we were offline/asleep!
        if (attempt > 1) {
          onStatusChange?.({
            isReconnecting: true,
            message: 'Checking if server finished processing in background...',
            attempt,
          });

          const completed = await this.checkCompletedScan(offlineClientId);
          if (completed) {
            onStatusChange?.({ isReconnecting: false });
            return completed;
          }
        }

        onStatusChange?.({
          isReconnecting: attempt > 1,
          message: attempt > 1 ? `Reconnecting to server (Attempt ${attempt}/${maxAttempts})...` : undefined,
          attempt,
        });

        const res = await fetch('/api/scans', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          // If 4xx client bad request (e.g. non-image file), do not retry
          if (res.status >= 400 && res.status < 500 && res.status !== 408) {
            throw new Error(json.error?.message || 'Verification failed');
          }
          throw new Error(json.error?.message || `Server error (${res.status})`);
        }

        onStatusChange?.({ isReconnecting: false });
        return json.data;
      } catch (err: any) {
        const errStr = (err?.message || '').toLowerCase();
        const isNetworkOrAbort =
          errStr.includes('failed to fetch') ||
          errStr.includes('network') ||
          errStr.includes('abort') ||
          errStr.includes('connection') ||
          errStr.includes('server error (50') ||
          err?.name === 'AbortError';

        if (!isNetworkOrAbort || attempt >= maxAttempts) {
          throw err;
        }

        // If screen is off, wait for wake-up. Otherwise, back off briefly
        onStatusChange?.({
          isReconnecting: true,
          message: 'Connection interrupted. Recovering in background...',
          attempt,
        });

        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          await this.waitForForegroundOrOnline(45000);
        } else {
          const delayMs = Math.min(1200 * Math.pow(1.8, attempt - 1), 6000);
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }

    throw new Error('Verification timed out after background reconnect attempts. Please try again.');
  }
}
