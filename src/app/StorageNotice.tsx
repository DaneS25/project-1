import {
  useAppData,
  type StorageNotice as Notice,
} from '@/shared/store/AppDataContext'
import styles from './StorageNotice.module.css'

const MESSAGES: Record<Notice, string> = {
  corruptBackedUp:
    "Your saved budget data couldn't be read, so the app has started fresh. The old data hasn't been deleted: a backup copy is kept before anything new is saved.",
  corruptNotBackedUp:
    "Your saved budget data couldn't be read or backed up. To protect it, changes you make now won't be saved.",
  unavailable:
    "Your browser is blocking storage, so changes you make won't be kept after you close this page.",
  saveFailed:
    "Your latest change couldn't be saved, possibly because browser storage is full. It will be lost if you close this page.",
}

/** Explains when saved data may not match what's on screen. */
export function StorageNotice() {
  const { notice } = useAppData()

  // The live region is always rendered so screen readers announce changes.
  return (
    <div role="status" aria-label="Saved data" className={styles.region}>
      {notice && (
        <p className={styles.notice}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5h.01" />
          </svg>
          <span>{MESSAGES[notice]}</span>
        </p>
      )}
    </div>
  )
}
