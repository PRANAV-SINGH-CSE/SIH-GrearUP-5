'use client';

import { useEffect } from 'react';

/**
 * Triggers a solid, crisp haptic vibration on mobile devices.
 * A 40ms pulse delivers a firm, mechanical tactile click sensation.
 */
export function triggerSolidHaptic(duration = 40) {
  if (typeof window === 'undefined') return;
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(duration);
    }
  } catch {
    // Ignore any browser permission or policy errors
  }
}

/**
 * Global Haptic Feedback listener for mobile devices.
 * Intercepts touch and pointer presses on buttons and interactive elements,
 * providing instantaneous solid haptic feedback so the user physically feels
 * when a button is pressed.
 */
export function HapticFeedbackProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastHapticTime = 0;

    const handlePress = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Identify if the pressed element or an ancestor is an interactive button/control
      const interactiveEl = target.closest(
        'button, [role="button"], a, input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"], [data-haptic], .btn'
      );

      if (!interactiveEl) return;

      // Check if disabled
      if (
        interactiveEl.hasAttribute('disabled') ||
        interactiveEl.getAttribute('aria-disabled') === 'true'
      ) {
        return;
      }

      // Debounce by 80ms to avoid double triggering between pointerdown and touchstart
      const now = performance.now();
      if (now - lastHapticTime < 80) return;
      lastHapticTime = now;

      // Trigger solid tactile feedback
      triggerSolidHaptic(40);
    };

    // Use capture phase on pointerdown for zero-latency touch response
    window.addEventListener('pointerdown', handlePress, { passive: true, capture: true });
    window.addEventListener('touchstart', handlePress, { passive: true, capture: true });

    return () => {
      window.removeEventListener('pointerdown', handlePress, { capture: true });
      window.removeEventListener('touchstart', handlePress, { capture: true });
    };
  }, []);

  return null;
}
