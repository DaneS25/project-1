import { useState } from 'react'
import { EmptyState } from '@/shared/components/EmptyState'
import { MonthNav } from '@/shared/components/MonthNav'
import { formatMonth, monthOf } from '@/shared/lib/dates'
import { useAppData } from '@/shared/store/AppDataContext'
import type { IsoDate } from '@/shared/types'
import { spendingByCategory } from '../logic/insights'
import { BudgetChart } from './BudgetChart'
import { CategoryChart } from './CategoryChart'
import { ChartCarousel, type ChartSlide } from './ChartCarousel'
import { DonutChart } from './DonutChart'
import { StatsStrip } from './StatsStrip'
import { TrendChart } from './TrendChart'
import styles from './InsightsPanel.module.css'

type InsightsPanelProps = {
  /** Today's local date; Insights opens on its month. */
  today: IsoDate
}

/**
 * Charts of the user's spending, with a month selector of its own (browsing
 * here doesn't move the monthly summary). Shows an empty state for a month
 * with no transactions.
 */
export function InsightsPanel({ today }: InsightsPanelProps) {
  const { data } = useAppData()
  const homeMonth = monthOf(today)
  const [month, setMonth] = useState(homeMonth)
  const breakdown = spendingByCategory(data, month)

  // The charts, in order; built only when the month can be charted.
  const slides: ChartSlide[] = breakdown.ok
    ? [
        {
          id: 'breakdown',
          title: 'Where the money went',
          content: (
            <DonutChart
              breakdown={breakdown.value}
              monthLabel={formatMonth(month)}
            />
          ),
        },
        {
          id: 'trend',
          title: 'Spending trend',
          content: <TrendChart data={data} month={month} />,
        },
        {
          id: 'budget',
          title: 'Budget vs actual',
          content: <BudgetChart data={data} month={month} />,
        },
        {
          id: 'category',
          title: 'Category over time',
          content: <CategoryChart data={data} month={month} />,
        },
      ]
    : []

  return (
    <div className={styles.insights}>
      <MonthNav month={month} homeMonth={homeMonth} onChange={setMonth} />
      {breakdown.ok && <StatsStrip data={data} month={month} />}
      {!breakdown.ok ? (
        <p className={styles.error}>
          The totals for {formatMonth(month)} are too large to chart. Check for
          an amount entered by mistake.
        </p>
      ) : breakdown.value.totalCents === 0 ? (
        <EmptyState
          title={`No spending in ${formatMonth(month)}`}
          description="Add transactions for this month to see charts of where the money went."
          pinkEmoji="🌈"
        />
      ) : (
        <ChartCarousel slides={slides} />
      )}
    </div>
  )
}
