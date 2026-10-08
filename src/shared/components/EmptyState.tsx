import styles from './EmptyState.module.css'

type EmptyStateProps = {
  title: string
  description: string
}

/** Friendly placeholder for a list or view with no data yet. */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
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
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
    </div>
  )
}
