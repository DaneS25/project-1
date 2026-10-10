import { addMonths, formatMonth } from '@/shared/lib/dates'
import type { MonthKey } from '@/shared/types'
import { Button } from './Button'
import styles from './MonthNav.module.css'

type MonthNavProps = {
  month: MonthKey
  /** The month to come back to, e.g. the current month. */
  homeMonth: MonthKey
  onChange: (month: MonthKey) => void
}

/**
 * Previous and Next month buttons around the month name, plus "Back to
 * this month" when away from it. The month name is a live region, so a
 * change of month is announced. The parent owns the month and decides how
 * to apply a change (for example with a transition).
 */
export function MonthNav({ month, homeMonth, onChange }: MonthNavProps) {
  const previous = addMonths(month, -1)
  const next = addMonths(month, 1)

  return (
    <>
      <div className={styles.nav}>
        <Button
          variant="outline"
          className={styles.navButton}
          aria-label={`Previous month, ${formatMonth(previous)}`}
          onClick={() => {
            onChange(previous)
          }}
        >
          <span aria-hidden="true">‹</span> Previous
        </Button>
        <p className={styles.month} role="status">
          {formatMonth(month)}
        </p>
        <Button
          variant="outline"
          className={styles.navButton}
          aria-label={`Next month, ${formatMonth(next)}`}
          onClick={() => {
            onChange(next)
          }}
        >
          Next <span aria-hidden="true">›</span>
        </Button>
      </div>
      {month !== homeMonth && (
        <Button
          variant="outline"
          size="small"
          className={styles.homeButton}
          onClick={() => {
            onChange(homeMonth)
          }}
        >
          Back to this month
        </Button>
      )}
    </>
  )
}
