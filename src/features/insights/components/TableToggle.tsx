import { useId, useState, type ReactNode } from 'react'
import { Button } from '@/shared/components/Button'
import styles from './ChartParts.module.css'

type TableToggleProps = {
  /** The `<table>` with the chart's figures. */
  children: ReactNode
}

/**
 * "Show as table": a disclosure button (`aria-expanded`, `aria-controls`)
 * that shows or hides the chart's figures as a real table. The label stays
 * the same; `aria-expanded` and the tinted style say whether it's open.
 */
export function TableToggle({ children }: TableToggleProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className={styles.tableToggle}>
      <Button
        variant="outline"
        size="small"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen((value) => !value)
        }}
      >
        Show as table
      </Button>
      <div id={id} className={styles.tableWrap} hidden={!open}>
        {children}
      </div>
    </div>
  )
}
