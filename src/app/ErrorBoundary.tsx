import { Component, type ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

/**
 * Shows a plain recovery message instead of a blank page if rendering
 * fails. React only supports error boundaries as class components. React
 * itself reports the caught error to the console, so it isn't swallowed.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  override render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className={styles.fallback}>
        <div className={styles.card} role="alert">
          <h1 className={styles.title}>Something went wrong</h1>
          <p className={styles.message}>
            The budget app hit a problem and couldn&apos;t show this page.
            Reloading usually fixes it. Data already saved in this browser is
            kept.
          </p>
          <button
            className={styles.button}
            type="button"
            onClick={() => {
              window.location.reload()
            }}
          >
            Reload the page
          </button>
        </div>
      </main>
    )
  }
}
