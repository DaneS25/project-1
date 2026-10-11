import { usePalette } from '@/shared/hooks/usePalette'
import styles from './EmptyState.module.css'

type EmptyStateProps = {
  title: string
  description: string
  /** Shown in place of the plain icon in pink mode; decorative. */
  pinkEmoji?: string
}

/** Friendly placeholder for a list or view with no data yet. */
export function EmptyState({
  title,
  description,
  pinkEmoji = '🌸',
}: EmptyStateProps) {
  const isPink = usePalette() === 'pink'

  return (
    <div className={styles.emptyState}>
      {isPink ? (
        <span
          className={styles.emoji}
          aria-hidden="true"
          data-decoration="pink"
        >
          {pinkEmoji}
        </span>
      ) : (
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          width="40"
          height="40"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 10h18M7 15h4" />
        </svg>
      )}
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
    </div>
  )
}
