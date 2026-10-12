import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SESSION_KEY_PREFIX = 'tahfiz_progress_dismissed_';

function readSessionDismissed(userId: number): boolean {
  try {
    return sessionStorage.getItem(`${SESSION_KEY_PREFIX}${userId}`) === '1';
  } catch {
    return false;
  }
}

function writeSessionDismissed(userId: number) {
  try {
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${userId}`, '1');
  } catch {
    // sessionStorage unavailable — dismissal lasts only until remount
  }
}

export interface InstructorProgressFlagResult {
  /** Whether the progress onboarding prompt should be shown. */
  shouldAnimate: boolean;
  /** Permanently dismisses the prompt (stored on the user record). */
  markProgressCompleted: () => void;
  /** Dismisses the prompt for the rest of this browser tab session. */
  dismissForSession: () => void;
  /** Whether the hook has finished initializing. */
  isReady: boolean;
}

/**
 * Determines whether to show the "Ready to track progress?" prompt.
 *
 * Permanent dismissal is stored server-side on the user
 * (`progress_onboarding_dismissed`), so it follows the user across devices.
 * "Maybe later" is remembered in sessionStorage so it survives navigation.
 * The prompt is also suppressed once the instructor has logged any session.
 *
 * @param userId - The user's database ID. If null/undefined, the prompt is suppressed.
 */
export function useInstructorProgressFlag(
  userId: number | null | undefined
): InstructorProgressFlagResult {
  const { user, checkAuth } = useAuth();
  const [hasActivity, setHasActivity] = useState<boolean | null>(null);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [permanentlyDismissed, setPermanentlyDismissed] = useState(false);

  const serverDismissed = !!user?.progress_onboarding_dismissed;

  useEffect(() => {
    if (!userId) return;
    setSessionDismissed(readSessionDismissed(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId || serverDismissed) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await apiFetch('/api/sessions/instructor/has-activity');
        if (!response.ok) throw new Error('has-activity failed');
        const data = await response.json();
        if (!cancelled) setHasActivity(!!(data.hasActivity ?? data.data?.hasActivity));
      } catch {
        // Fail safe: don't nag when we can't tell
        if (!cancelled) setHasActivity(true);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, serverDismissed]);

  const markProgressCompleted = useCallback(() => {
    setPermanentlyDismissed(true);
    apiFetch('/api/users/progress-onboarding/dismiss', { method: 'POST' })
      .then((res) => { if (res.ok) return checkAuth(); })
      .catch(() => { /* local state already hides the prompt */ });
  }, [checkAuth]);

  const dismissForSession = useCallback(() => {
    if (userId) writeSessionDismissed(userId);
    setSessionDismissed(true);
  }, [userId]);

  const isReady = !userId || serverDismissed || hasActivity !== null;
  const shouldAnimate =
    !!userId && isReady && !serverDismissed && !permanentlyDismissed && !sessionDismissed && hasActivity === false;

  return { shouldAnimate, markProgressCompleted, dismissForSession, isReady };
}
