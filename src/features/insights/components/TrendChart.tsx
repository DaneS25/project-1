import { useState } from 'react'
import { formatMonth } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import type { AppData, MonthKey } from '@/shared/types'
import { monthlyTotals } from '../logic/insights'
import { budgetRuns, niceScale } from '../logic/trend'
import {
  AmountGrid,
  HEIGHT,
  MonthLabels,
  WIDTH,
  monthGeometry,
} from './MonthAxes'
import { RangeToggle, type ChartRange } from './RangeToggle'
import styles from './TrendChart.module.css'

type TrendChartProps = {
  data: AppData
  /** The selected month: the last bar, highlighted. */
  month: MonthKey
}

/**
 * "Spending trend": total spending per month for the 6 or 12 months up to
 * the selected one, with the total monthly budget as a dashed line where
 * budgets are set. The selected month's bar has an outline and a bold
 * label, not just a different colour. A visually hidden table gives the
 * same figures as text.
 */
export function TrendChart({ data, month }: TrendChartProps) {
  const [range, setRange] = useState<ChartRange>(6)
  const result = monthlyTotals(data, month, range)
  const toggle = <RangeToggle range={range} onChange={setRange} />

  if (!result.ok) {
    return (
      <div className={styles.trend}>
        {toggle}
        <p className={styles.message}>
          These totals are too large to chart. Check for an amount entered by
          mistake.
        </p>
      </div>
    )
  }

  const totals = result.value
  const max = Math.max(...totals.flatMap((t) => [t.spentCents, t.budgetCents]))
  const scale = niceScale(max)
  // Geometry only: floats are fine from here on.
  const geometry = monthGeometry(totals.length, scale)
  const { slot, y, centreX, baseY } = geometry
  const barWidth = slot * 0.62
  const label = `Spending trend for the ${String(range)} months to ${formatMonth(month)}`

  return (
    <div className={styles.trend}>
      {toggle}
      <svg
        className={styles.svg}
        viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
        role="img"
        aria-label={`${label}. The table that follows lists each month.`}
      >
        <AmountGrid scale={scale} geometry={geometry} />
        <g key={range} className={styles.bars}>
          {totals.map((total, index) => {
            const isSelected = total.month === month
            const top = y(total.spentCents)
            return (
              <rect
                key={total.month}
                className={styles.bar}
                data-month={total.month}
                data-selected={isSelected || undefined}
                x={centreX(index) - barWidth / 2}
                y={top}
                width={barWidth}
                height={baseY - top}
              />
            )
          })}
        </g>
        {budgetRuns(totals).map(({ from, to }) => {
          const points = totals
            .slice(from, to + 1)
            .map(
              (total, offset) =>
                [centreX(from + offset), y(total.budgetCents)] as const,
            )
          // A lone month's budget is a short level line across its bar.
          const drawn =
            points.length === 1 && points[0]
              ? [
                  [points[0][0] - slot / 2, points[0][1]],
                  [points[0][0] + slot / 2, points[0][1]],
                ]
              : points
          return (
            <polyline
              key={from}
              className={styles.budgetLine}
              data-budget-run={`${String(from)}-${String(to)}`}
              points={drawn
                .map(([px, py]) => `${String(px)},${String(py)}`)
                .join(' ')}
            />
          )
        })}
        <MonthLabels
          months={totals.map((total) => total.month)}
          selected={month}
          geometry={geometry}
        />
      </svg>
      <p className={styles.key} aria-hidden="true">
        <span className={styles.keyBar} /> Spent
        <span className={styles.keyLine} /> Total budget
      </p>
      <table className={styles.visuallyHidden}>
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Spent</th>
            <th scope="col">Total budget</th>
          </tr>
        </thead>
        <tbody>
          {totals.map((total) => (
            <tr key={total.month}>
              <th scope="row">
                {formatMonth(total.month)}
                {total.month === month ? ' (selected)' : ''}
              </th>
              <td>{formatCents(total.spentCents)}</td>
              <td>
                {total.budgetCents === 0
                  ? 'No budgets set'
                  : formatCents(total.budgetCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
