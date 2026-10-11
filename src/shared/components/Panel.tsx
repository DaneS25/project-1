import { useId, type ReactNode } from 'react'
import { PinkDecoration } from './PinkDecoration'
import styles from './Panel.module.css'

type PanelProps = {
  title: string
  description?: string
  /** An emoji or icon after the heading, shown only in pink mode. */
  pinkIcon?: ReactNode
  children: ReactNode
}

/** A titled card section, exposed to assistive tech as a named region. */
export function Panel({ title, description, pinkIcon, children }: PanelProps) {
  const headingId = useId()

  return (
    <section className={styles.panel} aria-labelledby={headingId}>
      <div className={styles.header}>
        <h2 id={headingId} className={styles.title}>
          {title}
          {pinkIcon !== undefined && (
            <PinkDecoration className={styles.pinkIcon}>
              {pinkIcon}
            </PinkDecoration>
          )}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children}
    </section>
  )
}
