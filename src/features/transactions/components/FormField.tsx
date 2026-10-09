import type { ReactNode } from 'react'
import styles from './TransactionForm.module.css'

type FormFieldProps = {
  label: string
  /** The `id` of the control, so the label is tied to it. */
  controlId: string
  /** The `id` the control's `aria-describedby` points at. */
  errorId: string
  error: string | undefined
  /** Shown after the label, e.g. "optional". */
  labelSuffix?: string
  children: ReactNode
}

/** A labelled form control with its validation message shown below it. */
export function FormField({
  label,
  controlId,
  errorId,
  error,
  labelSuffix,
  children,
}: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={controlId}>
        {label}
        {labelSuffix && (
          <span className={styles.labelSuffix}> ({labelSuffix})</span>
        )}
      </label>
      {children}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          <svg
            className={styles.errorIcon}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
