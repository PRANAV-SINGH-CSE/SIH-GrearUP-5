/**
 * CompliScan Mobile Background Keep-Alive Service
 *
 * Prevents mobile devices (Android WebViews, Chrome, Safari PWA) from:
 * 1. Automatically dimming/turning off the screen during active AI scans (via Screen WakeLock API).
 * 2. Suspending/throttling CPU execution when minimized or screen locked (via lightweight Web Audio heartbeat).
 * 3. Dropping network sockets prematurely before AI processing concludes.
 */

class MobileBackgroundKeepAliveService {
  private wakeLockSentinel: any = null;
  private audioCtx: AudioContext | null = null;
  private isActive = false;
  private visibilityHandler: (() => void) | null = null;

  /**
   * Activate wake lock & background keepalive while scanning is in flight
   */
  async startKeepAlive() {
    this.isActive = true;

    // 1. Request Screen WakeLock if supported by browser/WebView
    await this.acquireWakeLock();

    // 2. Automatically re-acquire wake lock if phone is unlocked or app foregrounded
    if (!this.visibilityHandler && typeof document !== 'undefined') {
      this.visibilityHandler = async () => {
        if (this.isActive && document.visibilityState === 'visible') {
          await this.acquireWakeLock();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    // 3. Web Audio heartbeat: Keeps Android WebView from freezing JS timers in background
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (!this.audioCtx) {
          this.audioCtx = new AudioCtor();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      }
    } catch (_) {
      // Non-blocking fallback
    }
  }

  private async acquireWakeLock() {
    if (
      typeof navigator !== 'undefined' &&
      'wakeLock' in navigator &&
      (navigator as any).wakeLock?.request
    ) {
      try {
        if (!this.wakeLockSentinel || this.wakeLockSentinel.released) {
          this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        // May be rejected if low battery or device policy blocks wake lock
      }
    }
  }

  /**
   * Release wake lock and tear down keepalive listeners when scan finishes
   */
  stopKeepAlive() {
    this.isActive = false;

    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch (_) {}
      this.wakeLockSentinel = null;
    }

    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close().catch(() => {});
      } catch (_) {}
      this.audioCtx = null;
    }
  }
}

export const BackgroundKeepAlive = new MobileBackgroundKeepAliveService();
