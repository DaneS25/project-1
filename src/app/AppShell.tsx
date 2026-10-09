import type { ReactNode } from 'react'
import styles from './AppShell.module.css'
import { ThemeToggle } from './ThemeToggle'

type AppShellProps = {
  children: ReactNode
}

/**
 * Top-level page layout: sticky header with the app name and theme choice,
 * then main content.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <svg
            className={styles.logo}
            viewBox="0 0 32 32"
            width="36"
            height="36"
            aria-hidden="true"
            focusable="false"
          >
            <rect className={styles.logoTile} width="32" height="32" rx="9" />
            <circle className={styles.logoTrack} cx="16" cy="16" r="8" />
            <path className={styles.logoArc} d="M16 8a8 8 0 0 1 7.6 10.5" />
          </svg>
          <div>
            <h1 className={styles.title}>Budget</h1>
            <p className={styles.tagline}>
              Track spending against your monthly budgets
            </p>
          </div>
          <div className={styles.headerEnd}>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
