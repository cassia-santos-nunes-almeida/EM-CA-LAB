import { useEffect, useRef } from 'react';
import { track } from '@vercel/analytics';
import type { BeforeSendEvent } from '@vercel/analytics';

const OWNER_FLAG_KEY = 'emac-analytics-owner';

/**
 * Check if the current visitor has flagged themselves as the app owner.
 * To exclude yourself from analytics, run in the browser console:
 *   localStorage.setItem('emac-analytics-owner', '1')
 */
export function isOwner(): boolean {
  try {
    return localStorage.getItem(OWNER_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * beforeSend filter for Vercel Analytics — drops events from the owner.
 */
export function beforeSendFilter(event: BeforeSendEvent): BeforeSendEvent | null {
  if (isOwner()) return null;
  return event;
}

/**
 * Detect referrer source from URL query parameters.
 * Supports: ?ref=moodle, ?utm_source=moodle
 */
function detectReferrerSource(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('utm_source') || params.get('ref') || null;
  } catch {
    return null;
  }
}

/**
 * Hook that tracks session duration and referrer source via Vercel custom events.
 * Call once at the app root level.
 */
export function useAnalytics() {
  const sessionStart = useRef(0);

  useEffect(() => {
    sessionStart.current = Date.now();
    if (isOwner()) return;

    // Track referrer source on first load
    const source = detectReferrerSource();
    if (source) {
      track('referrer-source', { source, page: window.location.pathname });
    }

    // Track session start
    track('session-start', {
      referrer: document.referrer || 'direct',
      source: source || 'direct',
    });

    // Send session duration on page hide (covers tab close, navigate away, minimize)
    function sendDuration() {
      const durationSec = Math.round((Date.now() - sessionStart.current) / 1000);
      if (durationSec < 2) return; // skip accidental bounces
      track('session-duration', {
        seconds: durationSec,
        minutes: Math.round(durationSec / 60 * 10) / 10,
        page: window.location.pathname,
      });
    }

    // visibilitychange is more reliable than beforeunload on mobile
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        sendDuration();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', sendDuration);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', sendDuration);
    };
  }, []);
}
