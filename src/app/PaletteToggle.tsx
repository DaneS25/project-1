import { useEffect, useState } from 'react'
import {
  loadPalette,
  savePalette,
  type Palette,
} from '@/shared/storage/palette'
import type { StorageLike } from '@/shared/storage/storage'
import styles from './PaletteToggle.module.css'

type PaletteToggleProps = {
  /** Defaults to `window.localStorage`. */
  storage?: StorageLike
}

/**
 * Turns the pink palette on and off. A toggle button with `aria-pressed`, so
 * screen readers announce "Pink theme, toggle button, pressed". Pink sets
 * `data-palette="pink"` on <html>; sunset removes it. Independent of the
 * System/Light/Dark choice. index.html applies a saved choice before first
 * paint.
 */
export function PaletteToggle({ storage }: PaletteToggleProps) {
  const [palette, setPalette] = useState(() => loadPalette(storage))
  const isPink = palette === 'pink'

  // An allowed effect: it keeps an attribute outside React's tree in sync.
  useEffect(() => {
    const root = document.documentElement
    if (palette === 'pink') root.dataset.palette = palette
    else delete root.dataset.palette
    return () => {
      delete root.dataset.palette
    }
  }, [palette])

  function handleClick() {
    const next: Palette = isPink ? 'sunset' : 'pink'
    setPalette(next)
    // A failed save only means the choice won't survive a reload; the
    // storage notice already covers blocked or full storage.
    savePalette(next, storage)
  }

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={isPink}
      onClick={handleClick}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
      </svg>
      <span className={styles.label}>Pink theme</span>
    </button>
  )
}
