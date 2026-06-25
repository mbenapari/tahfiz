import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/api';

const STORAGE_KEY_PREFIX = 'tahfiz_progress_flagged_';
const ALGORITHM = 'AES-GCM';

/**
 * Derives a 256-bit AES key from a string using SHA-256.
 * Uses the SubtleCrypto API for consistent cross-tab encryption.
 */
async function deriveKey(rawKey: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(rawKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('tahfiz-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-GCM and stores it as base64.
 * The IV is prepended to the ciphertext (12 bytes IV + ciphertext).
 */
async function encryptValue(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  );
  // Combine IV + ciphertext into a single buffer and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64-encoded ciphertext (with prepended IV) using AES-GCM.
 */
async function decryptValue(encoded: string, key: CryptoKey): Promise<string | null> {
  try {
    const decoder = new TextDecoder();
    const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );
    return decoder.decode(decrypted);
  } catch {
    // Tampered or corrupted data — treat as no flag set
    return null;
  }
}

/**
 * Returns the storage key scoped to a specific user ID.
 * Uses a deterministic derivation to avoid storing raw user IDs in the key name.
 */
function getStorageKey(userId: number): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export interface InstructorProgressFlagResult {
  /** Whether the animated UI should be shown for this instructor. */
  shouldAnimate: boolean;
  /** Marks the instructor as having completed their first progress action. */
  markProgressCompleted: () => void;
  /** Dismisses the animation for the current session without marking completion. */
  dismissForSession: () => void;
  /** Whether the hook has finished initializing (reading from storage). */
  isReady: boolean;
}

/**
 * Hook that determines whether to show an animated attention-grabbing UI
 * for instructors who have never logged student progress.
 *
 * State is persisted in encrypted localStorage tied to the instructor's user ID.
 * Once marked as completed, the animation will never show again for that user.
 *
 * Checks the instructor's own session history via API — not school-wide progress.
 *
 * @param userId - The instructor's unique database ID. If null/undefined, animation is suppressed.
 */
export function useInstructorProgressFlag(
  userId: number | null | undefined
): InstructorProgressFlagResult {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isReady, setIsReady] = useState(false);
  // Track per-session dismissal (resets on page reload)
  const sessionDismissed = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function checkFlag() {
      // Guard: no userId → no animation needed
      if (!userId) {
        setShouldAnimate(false);
        setIsReady(true);
        return;
      }

      try {
        const storageKey = getStorageKey(userId);
        const raw = localStorage.getItem(storageKey);

        if (raw) {
          // Flag exists in storage — check if permanently dismissed
          const derivedKey = await deriveKey(storageKey);
          const decrypted = await decryptValue(raw, derivedKey);

          if (!cancelled) {
            setShouldAnimate(decrypted !== 'completed');
            setIsReady(true);
          }
          return;
        }

        // No localStorage flag — check the instructor's own session history via API
        const response = await apiFetch('/api/sessions/instructor/has-activity');
        if (response.ok) {
          const data = await response.json();
          if (data.hasActivity) {
            // Instructor has logged sessions before — permanently suppress animation
            const derivedKey = await deriveKey(storageKey);
            const encrypted = await encryptValue('completed', derivedKey);
            localStorage.setItem(storageKey, encrypted);

            if (!cancelled) {
              setShouldAnimate(false);
              setIsReady(true);
            }
            return;
          }
        }

        // Instructor has never logged a session — show animation
        if (!cancelled) {
          setShouldAnimate(true);
          setIsReady(true);
        }
      } catch {
        // On any error, default to not showing animation (fail safe)
        if (!cancelled) {
          setShouldAnimate(false);
          setIsReady(true);
        }
      }
    }

    checkFlag();
    return () => { cancelled = true; };
  }, [userId]);

  const markProgressCompleted = useCallback(() => {
    if (!userId) return;

    const storageKey = getStorageKey(userId);
    deriveKey(storageKey).then((key) => {
      encryptValue('completed', key).then((encrypted) => {
        localStorage.setItem(storageKey, encrypted);
        setShouldAnimate(false);
        sessionDismissed.current = false;
      });
    }).catch(() => {
      // Fallback: still update state even if storage fails
      setShouldAnimate(false);
      sessionDismissed.current = false;
    });
  }, [userId]);

  const dismissForSession = useCallback(() => {
    sessionDismissed.current = true;
    setShouldAnimate(false);
  }, []);

  // Respect per-session dismissal
  return {
    shouldAnimate: shouldAnimate && !sessionDismissed.current,
    markProgressCompleted,
    dismissForSession,
    isReady,
  };
}
