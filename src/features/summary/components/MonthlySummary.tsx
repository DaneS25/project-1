import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { compareCategoryNames } from '@/shared/lib/categories'
import { addMonths, formatMonth, monthOf } from '@/shared/lib/dates'
import { withViewTransition } from '@/shared/lib/viewTransition'
import { useAppData } from '@/shared/store/AppDataContext'
import type { IsoDate, MonthKey } from '@/shared/types'
import { summarizeMonth } from '../logic/summary'
import { CategorySummaryList } from './CategorySummaryList'
import styles from './MonthlySummary.module.css'
import { SummaryTotals } from './SummaryTotals'

type MonthlySummaryProps = {
  /** Today's local date; the summary opens on its month. */
  today: IsoDate
}

/**
 * Spent vs budget for one month, with buttons to move between months. The
 * selected month is UI state here, not stored data. The month name is a
 * live region, so a change of month is announced.
 */
export function MonthlySummary({ today }: MonthlySummaryProps) {
  const { data } = useAppData()
  const currentMonth = monthOf(today)
  const [month, setMonth] = useState(currentMonth)
  const result = summarizeMonth(data, month)
  const previous = addMonths(month, -1)
  const next = addMonths(month, 1)

  /**
   * Changes month, sliding the content left for a later month and right for
   * an earlier one where the View Transitions API is available and motion
   * is allowed. flushSync applies the change inside the transition callback,
   * so the browser snapshots the new month (and the month name, a live
   * region, updates and is announced as before).
   */
  function goTo(target: MonthKey) {
    withViewTransition(
      () => {
        flushSync(() => {
          setMonth(target)
        })
      },
      target > month ? 'next' : 'previous',
    )
  }

  return (
    <div className={styles.summary}>
      <div className={styles.nav}>
        <Button
          variant="outline"
          className={styles.navButton}
          type="button"
          aria-label={`Previous month, ${formatMonth(previous)}`}
          onClick={() => {
            goTo(previous)
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
          type="button"
          aria-label={`Next month, ${formatMonth(next)}`}
          onClick={() => {
            goTo(next)
          }}
        >
          Next <span aria-hidden="true">›</span>
        </Button>
      </div>
      {month !== currentMonth && (
        <Button
          variant="outline"
          size="small"
          className={styles.todayButton}
          type="button"
          onClick={() => {
            goTo(currentMonth)
          }}
        >
          Back to this month
        </Button>
      )}
      {/* Keyed by month so the content (and its bars) animate in again. */}
      <div key={month} className={styles.content}>
        {!result.ok ? (
          <p className={styles.error}>
            The totals for {formatMonth(month)} are too large to show. Check for
            an amount entered by mistake.
          </p>
        ) : !result.value.hasTransactions ? (
          <EmptyState
            title={`No spending in ${formatMonth(month)}`}
            description="Transactions you add for this month will show here."
          />
        ) : (
          <>
            <SummaryTotals totals={result.value.totals} />
            <CategorySummaryList
              categories={[...result.value.categories].sort((a, b) =>
                compareCategoryNames(a.category, b.category),
              )}
            />
          </>
        )}
      </div>
    </div>
  )
}
