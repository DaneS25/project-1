import { useId, type ReactNode } from 'react'
import styles from './Panel.module.css'

type PanelProps = {
  title: string
  description?: string
  children: ReactNode
}

/** A titled card section, exposed to assistive tech as a named region. */
export function Panel({ title, description, children }: PanelProps) {
  const headingId = useId()

  return (
    <section className={styles.panel} aria-labelledby={headingId}>
      <div className={styles.header}>
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children}
    </section>
  )
}
