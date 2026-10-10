import { useState } from 'react'
import { Button } from '@/shared/components/Button'
import { formatMonth } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import type { AppData, MonthKey } from '@/shared/types'
import { formatAxisAmount } from '../logic/format'
import { monthlyTotals } from '../logic/insights'
import { budgetRuns, niceScale } from '../logic/trend'
import styles from './TrendChart.module.css'

type TrendChartProps = {
  data: AppData
  /** The selected month: the last bar, highlighted. */
  month: MonthKey
}

const RANGES = [6, 12] as const
type Range = (typeof RANGES)[number]

// Drawing area, in SVG units (the SVG scales to its width).
const WIDTH = 360
const HEIGHT = 200
const LEFT = 52
const RIGHT = 8
const TOP = 10
const BOTTOM = 26
const PLOT_W = WIDTH - LEFT - RIGHT
const PLOT_H = HEIGHT - TOP - BOTTOM

/**
 * "Spending trend": total spending per month for the 6 or 12 months up to
 * the selected one, with the total monthly budget as a dashed line where
 * budgets are set. The selected month's bar has an outline and a bold
 * label, not just a different colour. A visually hidden table gives the
 * same figures as text.
 */
export function TrendChart({ data, month }: TrendChartProps) {
  const [range, setRange] = useState<Range>(6)
  const result = monthlyTotals(data, month, range)

  const toggle = (
    <div className={styles.toggle} role="group" aria-label="Months shown">
      {RANGES.map((value) => (
        <Button
          key={value}
          variant="outline"
          size="small"
          aria-pressed={range === value}
          onClick={() => {
            setRange(value)
          }}
        >
          {value} months
        </Button>
      ))}
    </div>
  )

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
  const slot = PLOT_W / totals.length
  const barWidth = slot * 0.62
  const y = (cents: number) => TOP + PLOT_H - (cents / scale.topCents) * PLOT_H
  const centreX = (index: number) => LEFT + slot * index + slot / 2
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
        {scale.ticks.map((tick) => (
          <g key={tick}>
            <line
              className={styles.gridLine}
              x1={LEFT}
              x2={WIDTH - RIGHT}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text
              className={styles.axisLabel}
              x={LEFT - 6}
              y={y(tick)}
              dy="0.32em"
              textAnchor="end"
            >
              {formatAxisAmount(tick)}
            </text>
          </g>
        ))}
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
                height={TOP + PLOT_H - top}
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
        {totals.map((total, index) =>
          range === 12 && index % 2 === 1 && total.month !== month ? null : (
            <text
              key={total.month}
              className={styles.monthLabel}
              data-selected={total.month === month || undefined}
              x={centreX(index)}
              y={HEIGHT - 8}
              textAnchor="middle"
            >
              {shortMonth(total.month)}
            </text>
          ),
        )}
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

/** "Oct", "Jan '27" (the year is added in January, so a long range reads). */
function shortMonth(month: MonthKey): string {
  const name = formatMonth(month).slice(0, 3)
  return month.endsWith('-01') ? `${name} '${month.slice(2, 4)}` : name
}
