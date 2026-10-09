import styles from './MonthlySummary.module.css'

/** Warning mark shown next to "over budget" text; decorative only. */
export function OverBudgetIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3.5 2.5 20h19L12 3.5Z" />
      <path d="M12 9.5v4.5M12 17h.01" />
    </svg>
  )
}
