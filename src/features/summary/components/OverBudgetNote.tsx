import { formatCents } from '@/shared/lib/money'
import type { Cents } from '@/shared/types'
import { OverBudgetIcon } from './OverBudgetIcon'
import styles from './MonthlySummary.module.css'

type OverBudgetNoteProps = {
  /** How far over the budget, in cents (a positive amount). */
  overCents: Cents
  /** Layout from the caller; the red colour and icon come from here. */
  className?: string | undefined
}

/**
 * "Over budget by $X" in the danger red with a warning icon, so being over
 * budget is never shown by colour alone. Shared by the summary and the
 * budget vs actual chart so both mark it the same way.
 */
export function OverBudgetNote({ overCents, className }: OverBudgetNoteProps) {
  return (
    <p className={[className, styles.over].filter(Boolean).join(' ')}>
      <OverBudgetIcon />
      Over budget by {formatCents(overCents)}
    </p>
  )
}
