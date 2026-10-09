import { writeString, type SaveResult, type StorageLike } from './storage'

/**
 * Key for the theme choice. A UI preference, so it lives apart from the
 * versioned app data. index.html reads the same key before the app loads,
 * to avoid a flash of the wrong theme; keep the two in step.
 */
export const THEME_KEY = 'budget-app:theme'

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const

/** System follows the device setting; Light and Dark override it. */
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.some((preference) => preference === value)
}

/**
 * Reads the saved theme choice. Missing, invalid or unreadable values
 * (including blocked storage) fall back to System. Never throws.
 */
export function loadThemePreference(storage?: StorageLike): ThemePreference {
  try {
    const value = (storage ?? window.localStorage).getItem(THEME_KEY)
    return isThemePreference(value) ? value : 'system'
  } catch {
    // Storage is blocked: System is the right default, nothing to report.
    return 'system'
  }
}

/** Saves the theme choice. Never throws (storage may be full or blocked). */
export function saveThemePreference(
  preference: ThemePreference,
  storage?: StorageLike,
): SaveResult {
  return writeString(THEME_KEY, preference, storage)
}
