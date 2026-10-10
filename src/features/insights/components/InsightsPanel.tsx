import { useState } from 'react'
import { EmptyState } from '@/shared/components/EmptyState'
import { MonthNav } from '@/shared/components/MonthNav'
import { formatMonth, monthOf } from '@/shared/lib/dates'
import { useAppData } from '@/shared/store/AppDataContext'
import type { IsoDate } from '@/shared/types'
import { spendingByCategory } from '../logic/insights'
import { BudgetChart } from './BudgetChart'
import { ChartCarousel, type ChartSlide } from './ChartCarousel'
import { DonutChart } from './DonutChart'
import { TrendChart } from './TrendChart'
import styles from './InsightsPanel.module.css'

type InsightsPanelProps = {
  /** Today's local date; Insights opens on its month. */
  today: IsoDate
}

/** The charts, in order. Task 31 replaces the placeholder content. */
const CHART_TITLES = [
  { id: 'breakdown', title: 'Where the money went' },
  { id: 'trend', title: 'Spending trend' },
  { id: 'budget', title: 'Budget vs actual' },
  { id: 'category', title: 'Category over time' },
] as const

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

  const slides: ChartSlide[] = CHART_TITLES.map(({ id, title }) => ({
    id,
    title,
    content:
      id === 'breakdown' && breakdown.ok ? (
        <DonutChart
          breakdown={breakdown.value}
          monthLabel={formatMonth(month)}
        />
      ) : id === 'trend' ? (
        <TrendChart data={data} month={month} />
      ) : id === 'budget' ? (
        <BudgetChart data={data} month={month} />
      ) : (
        <p className={styles.placeholder}>This chart is coming soon.</p>
      ),
  }))

  return (
    <div className={styles.insights}>
      <MonthNav month={month} homeMonth={homeMonth} onChange={setMonth} />
      {!breakdown.ok ? (
        <p className={styles.error}>
          The totals for {formatMonth(month)} are too large to chart. Check for
          an amount entered by mistake.
        </p>
      ) : breakdown.value.totalCents === 0 ? (
        <EmptyState
          title={`No spending in ${formatMonth(month)}`}
          description="Add transactions for this month to see charts of where the money went."
        />
      ) : (
        <ChartCarousel slides={slides} />
      )}
    </div>
  )
}
