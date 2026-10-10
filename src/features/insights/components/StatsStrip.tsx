import { useId, type ReactNode } from 'react'
import { addMonths, formatIsoDate, formatMonth } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import type { AppData, MonthKey } from '@/shared/types'
import {
  formatChangeAmount,
  formatPercentChange,
  formatShare,
} from '../logic/format'
import { monthOverMonth, spendingByCategory } from '../logic/insights'
import { averageMonthlySpend, largestTransaction } from '../logic/stats'
import styles from './StatsStrip.module.css'

type StatsStripProps = {
  data: AppData
  month: MonthKey
}

const NO_DATA = 'No data yet'
const TOO_LARGE = 'Too large to show'

/**
 * Key figures for the selected month as a description list: total spent,
 * the change from last month (in words and as a percentage), the average
 * over the last 6 months, the top category and the largest transaction.
 * Each figure says "No data yet" when there's nothing to show. It isn't a
 * live region: the figures change with the month the user picks, and the
 * month selector already says which month that is.
 */
export function StatsStrip({ data, month }: StatsStripProps) {
  const headingId = useId()
  const breakdown = spendingByCategory(data, month)
  const change = monthOverMonth(data, month)
  const average = averageMonthlySpend(data, month)
  const largest = largestTransaction(data, month)
  const top = breakdown.ok ? breakdown.value.items[0] : undefined

  return (
    <section className={styles.strip} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.heading}>
        {formatMonth(month)} at a glance
      </h3>
      <dl className={styles.stats}>
        <Stat label="Total spent">
          {!breakdown.ok ? (
            <dd className={styles.value}>{TOO_LARGE}</dd>
          ) : breakdown.value.totalCents === 0 ? (
            <dd className={styles.empty}>{NO_DATA}</dd>
          ) : (
            <dd className={styles.value}>
              {formatCents(breakdown.value.totalCents)}
            </dd>
          )}
        </Stat>

        <Stat label={`Change from ${formatMonth(addMonths(month, -1))}`}>
          {!change.ok ? (
            <dd className={styles.value}>{TOO_LARGE}</dd>
          ) : change.value.currentCents === 0 &&
            change.value.previousCents === 0 ? (
            <dd className={styles.empty}>{NO_DATA}</dd>
          ) : (
            <>
              <dd className={styles.value}>
                {formatChangeAmount(change.value.changeCents)}
              </dd>
              <dd className={styles.detail}>
                {formatPercentChange(
                  change.value.changeCents,
                  change.value.previousCents,
                ) ?? `Percentage: ${NO_DATA}`}
              </dd>
            </>
          )}
        </Stat>

        <Stat label="Average per month, last 6 months">
          {!average.ok ? (
            <dd className={styles.value}>{TOO_LARGE}</dd>
          ) : average.value === null ? (
            <dd className={styles.empty}>{NO_DATA}</dd>
          ) : (
            <dd className={styles.value}>
              {formatCents(average.value.averageCents)}
            </dd>
          )}
        </Stat>

        <Stat label="Top category">
          {!breakdown.ok ? (
            <dd className={styles.value}>{TOO_LARGE}</dd>
          ) : top === undefined ? (
            <dd className={styles.empty}>{NO_DATA}</dd>
          ) : (
            <>
              <dd className={styles.value}>{top.category.name}</dd>
              <dd className={styles.detail}>
                {formatCents(top.spentCents)},{' '}
                {formatShare(top.spentCents, breakdown.value.totalCents)} of
                spending
              </dd>
            </>
          )}
        </Stat>

        <Stat label="Largest transaction">
          {largest === null ? (
            <dd className={styles.empty}>{NO_DATA}</dd>
          ) : (
            <>
              <dd className={styles.value}>
                {formatCents(largest.transaction.amountCents)}
              </dd>
              <dd className={styles.detail}>
                {largest.category?.name ?? 'Unknown category'},{' '}
                {formatIsoDate(largest.transaction.date)}
              </dd>
            </>
          )}
        </Stat>
      </dl>
    </section>
  )
}

/** One label and its value(s); the `<div>` groups them inside the `<dl>`. */
function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.stat}>
      <dt className={styles.label}>{label}</dt>
      {children}
    </div>
  )
}
