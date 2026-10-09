import { useEffect, useId, useState } from 'react'
import type { StorageLike } from '@/shared/storage/storage'
import {
  loadThemePreference,
  saveThemePreference,
  type ThemePreference,
} from '@/shared/storage/theme'
import styles from './ThemeToggle.module.css'

type ThemeToggleProps = {
  /** Defaults to `window.localStorage`. */
  storage?: StorageLike
}

const OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

/**
 * Chooses System, Light or Dark. A native radio group, so arrow keys move
 * between the choices and screen readers announce the current one. Light
 * and Dark set `data-theme` on <html>; System removes it so the device
 * setting applies. index.html applies a saved choice before first paint.
 */
export function ThemeToggle({ storage }: ThemeToggleProps) {
  const [preference, setPreference] = useState(() =>
    loadThemePreference(storage),
  )
  const name = useId()

  // An allowed effect: it keeps an attribute outside React's tree in sync.
  useEffect(() => {
    const root = document.documentElement
    if (preference === 'system') delete root.dataset.theme
    else root.dataset.theme = preference
    return () => {
      delete root.dataset.theme
    }
  }, [preference])

  function handleChange(value: ThemePreference) {
    setPreference(value)
    // A failed save only means the choice won't survive a reload; the
    // storage notice already covers blocked or full storage.
    saveThemePreference(value, storage)
  }

  return (
    <fieldset className={styles.toggle}>
      <legend className={styles.visuallyHidden}>Theme</legend>
      {OPTIONS.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            className={styles.input}
            type="radio"
            name={name}
            value={option.value}
            checked={preference === option.value}
            onChange={() => {
              handleChange(option.value)
            }}
          />
          <ThemeIcon value={option.value} />
          <span className={styles.label}>{option.label}</span>
        </label>
      ))}
    </fieldset>
  )
}

function ThemeIcon({ value }: { value: ThemePreference }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      {value === 'light' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </>
      )}
      {value === 'dark' && (
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      )}
      {value === 'system' && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path className={styles.iconFill} d="M12 4a8 8 0 0 1 0 16Z" />
        </>
      )}
    </svg>
  )
}
