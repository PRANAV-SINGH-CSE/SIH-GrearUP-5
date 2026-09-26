'use client';

import { useEffect } from 'react';

// Shared AudioContext for mobile web haptic transducer pop (iOS Safari & Android fallback)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      try {
        audioCtx = new AudioCtxClass();
      } catch {
        audioCtx = null;
      }
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Produces an ultra-short (15ms), low-frequency (120Hz) speaker impulse.
 * On mobile devices (especially iPhones where navigator.vibrate is disabled by Apple),
 * this physical transducer pop vibrates the device chassis against the palm.
 */
function playTactileImpulse() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.018);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.02);
  } catch {
    // Ignore audio restrictions
  }
}

/**
 * Triggers a solid, crisp mechanical haptic vibration on mobile devices.
 * Uses a solid dual-pulse pattern [45, 20, 35] on Android (Navigator Vibrate)
 * and physical speaker transducer pop on iOS Safari.
 */
export function triggerSolidHaptic(duration: number | number[] = [45, 20, 35]) {
  if (typeof window === 'undefined') return;

  let didVibrate = false;

  // 1. Android / Chrome / Mobile Browser Native Vibration API
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      // Solid tactile pattern: [45ms buzz, 20ms pause, 35ms thud]
      didVibrate = navigator.vibrate(duration);
    }
  } catch {
    didVibrate = false;
  }

  // 2. iOS Safari & universal tactile impulse fallback
  // If navigator.vibrate is unsupported (e.g. iOS) or blocked, the transducer click ensures physical feedback
  playTactileImpulse();

  return didVibrate;
}

/**
 * Global Haptic Feedback listener for mobile devices.
 * Listens to touch/pointer interactions on buttons, links, and cards.
 * Uses both pointerdown (instantaneous response) and click (guaranteed user-activation)
 * with smart debouncing so every button press feels distinctly solid.
 */
export function HapticFeedbackProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastHapticTime = 0;

    const handlePress = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Identify if the pressed element or an ancestor is an interactive button/control/card
      const interactiveEl = target.closest(
        'button, [role="button"], a, input, select, textarea, [data-haptic], .btn, [onclick], [tabindex="0"], .cursor-pointer'
      );

      // Also check cursor pointer style for custom clickable divs
      const isPointer =
        interactiveEl ||
        (target.classList && target.classList.contains('cursor-pointer')) ||
        (typeof window.getComputedStyle === 'function' &&
          window.getComputedStyle(target).cursor === 'pointer');

      if (!isPointer) return;

      // Check if disabled
      if (
        (interactiveEl && interactiveEl.hasAttribute('disabled')) ||
        (interactiveEl && interactiveEl.getAttribute('aria-disabled') === 'true')
      ) {
        return;
      }

      // Debounce by 90ms to avoid double triggering between pointer/touch/click
      const now = performance.now();
      if (now - lastHapticTime < 90) return;
      lastHapticTime = now;

      // Trigger solid tactile feedback
      triggerSolidHaptic();
    };

    // Attach to pointerdown (immediate touch contact), touchstart (mobile webviews),
    // and click (guaranteed user gesture activation in modern mobile Chrome)
    window.addEventListener('pointerdown', handlePress, { passive: true, capture: true });
    window.addEventListener('touchstart', handlePress, { passive: true, capture: true });
    window.addEventListener('click', handlePress, { passive: true, capture: true });

    // Expose global helper for direct button calls
    (window as any).__compliscan_haptic = triggerSolidHaptic;

    return () => {
      window.removeEventListener('pointerdown', handlePress, { capture: true });
      window.removeEventListener('touchstart', handlePress, { capture: true });
      window.removeEventListener('click', handlePress, { capture: true });
    };
  }, []);

  return null;
}
