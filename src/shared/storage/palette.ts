import { writeString, type SaveResult, type StorageLike } from './storage'

/**
 * Key for the colour palette choice. A UI preference, so it lives apart from
 * the versioned app data. index.html reads the same key before the app
 * loads, to avoid a flash of the wrong palette; keep the two in step.
 */
export const PALETTE_KEY = 'budget-app:palette'

export const PALETTES = ['sunset', 'pink'] as const

/** Sunset is the default; pink sets `data-palette="pink"` on <html>. */
export type Palette = (typeof PALETTES)[number]

export function isPalette(value: unknown): value is Palette {
  return PALETTES.some((palette) => palette === value)
}

/**
 * Reads the saved palette. Missing, invalid or unreadable values
 * (including blocked storage) fall back to sunset. Never throws.
 */
export function loadPalette(storage?: StorageLike): Palette {
  try {
    const value = (storage ?? window.localStorage).getItem(PALETTE_KEY)
    return isPalette(value) ? value : 'sunset'
  } catch {
    // Storage is blocked: sunset is the right default, nothing to report.
    return 'sunset'
  }
}

/** Saves the palette. Never throws (storage may be full or blocked). */
export function savePalette(
  palette: Palette,
  storage?: StorageLike,
): SaveResult {
  return writeString(PALETTE_KEY, palette, storage)
}
