/**
 * Audit Alert Notification Service
 * Manages real-time desktop & mobile notifications, haptic feedback,
 * and audio chimes for non-compliant batches under Legal Metrology Act rules.
 */

export class AuditAlertService {
  private static readonly STORAGE_KEY = 'compliscan-notifications';

  static isEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const val = window.localStorage.getItem(this.STORAGE_KEY);
    // Enabled by default unless explicitly turned off
    return val === null || val === 'true';
  }

  static setEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(this.STORAGE_KEY, String(enabled));
  }

  static async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    try {
      const res = await Notification.requestPermission();
      return res;
    } catch (_) {
      return 'unsupported';
    }
  }

  static triggerAlert(item: {
    productName: string;
    status?: string;
    overallStatus?: string;
    violationsCount?: number;
    explanation?: string;
  }): void {
    if (!this.isEnabled()) return;

    const effStatus = item.status || item.overallStatus || '';
    const isNonCompliant = effStatus === 'NON_COMPLIANT';
    const isNeedsReview = effStatus === 'NEEDS_REVIEW';

    // Only alert on statutory violations or items requiring urgent officer review
    if (!isNonCompliant && !isNeedsReview) return;

    // 1. Mobile haptic feedback vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (_) {}
    }

    // 2. Audible alert chime via Web Audio API (cross-platform, zero assets needed)
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Warning chime frequency ramp
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isNonCompliant ? 440 : 520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(isNonCompliant ? 880 : 660, ctx.currentTime + 0.18);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (_) {}

    // 3. System / Browser Push Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const title = isNonCompliant
        ? `⚠️ LMPC Audit Violation: ${item.productName || 'Packaged Commodity'}`
        : `🔍 Inspector Review Needed: ${item.productName || 'Packaged Commodity'}`;

      const body = isNonCompliant
        ? `Non-compliant batch detected under Legal Metrology Rules. Mandatory declarations missing or invalid.`
        : `Packaging requires officer verification due to borderline label sizing or image quality.`;

      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready
            .then((reg) => {
              reg.showNotification(title, {
                body,
                icon: '/icon.png',
                badge: '/icon.png',
                tag: 'compliscan-audit-alert',
              });
            })
            .catch(() => {
              new Notification(title, { body, icon: '/icon.png' });
            });
        } else {
          new Notification(title, { body, icon: '/icon.png' });
        }
      } catch (_) {}
    }
  }
}
