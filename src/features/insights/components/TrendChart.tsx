import { useId, useState } from 'react'
import { useElementWidth } from '@/shared/hooks/useElementWidth'
import { useFirstView } from '@/shared/hooks/useFirstView'
import { formatMonth } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import type { AppData, MonthKey } from '@/shared/types'
import { monthlyTotals } from '../logic/insights'
import { trendSummary } from '../logic/summaries'
import { budgetRuns, niceScale } from '../logic/trend'
import parts from './ChartParts.module.css'
import { ChartTooltip } from './ChartTooltip'
import {
  AmountGrid,
  DEFAULT_WIDTH,
  HEIGHT,
  MonthLabels,
  monthGeometry,
} from './MonthAxes'
import { RangeToggle, type ChartRange } from './RangeToggle'
import { TableToggle } from './TableToggle'
import styles from './TrendChart.module.css'
import { useMonthTooltip } from './useTooltip'

type TrendChartProps = {
  data: AppData
  /** The selected month: the last bar, highlighted. */
  month: MonthKey
}

/**
 * "Spending trend": total spending per month for the 6 or 12 months up to
 * the selected one, with the total monthly budget as a dashed line where
 * budgets are set. The selected month's bar has an outline and a bold
 * label, not just a different colour. A summary sentence leads, a tooltip
 * gives each month's figures on hover or keyboard focus, and "Show as
 * table" lists them all.
 */
export function TrendChart({ data, month }: TrendChartProps) {
  const [range, setRange] = useState<ChartRange>(6)
  const result = monthlyTotals(data, month, range)
  const { ref: areaRef, width } = useElementWidth(DEFAULT_WIDTH)
  const { ref: viewRef, seen } = useFirstView()
  const tooltipId = useId()
  const hintId = useId()
  const tooltip = useMonthTooltip(result.ok ? result.value.length : 0)
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
  const geometry = monthGeometry(totals.length, scale, width)
  const { slot, y, centreX, baseY } = geometry
  const barWidth = slot * 0.62
  const label = `Spending trend for the ${String(range)} months to ${formatMonth(month)}`
  const active = tooltip.index === null ? undefined : totals[tooltip.index]

  return (
    <div ref={viewRef} className={styles.trend} data-seen={seen || undefined}>
      <p className={parts.summary}>{trendSummary(totals)}</p>
      {toggle}
      <div ref={areaRef} className={parts.area} {...tooltip.areaProps}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${String(geometry.width)} ${String(HEIGHT)}`}
          role="img"
          aria-label={label}
          aria-describedby={active ? `${tooltipId} ${hintId}` : hintId}
          {...tooltip.focusProps}
        >
          <AmountGrid scale={scale} geometry={geometry} />
          <g key={range}>
            {totals.map((total, index) => {
              const isSelected = total.month === month
              const top = y(total.spentCents)
              return (
                <rect
                  key={total.month}
                  className={styles.bar}
                  data-month={total.month}
                  data-selected={isSelected || undefined}
                  data-active={index === tooltip.index || undefined}
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
          {/* Invisible full-height slots, so a month is easy to hover. */}
          {totals.map((total, index) => (
            <rect
              key={total.month}
              className={styles.hit}
              x={centreX(index) - slot / 2}
              y={0}
              width={slot}
              height={baseY}
              {...tooltip.hoverProps(index)}
            />
          ))}
        </svg>
        <p id={hintId} className={parts.visuallyHidden}>
          Use the Left and Right arrow keys to read each month.
        </p>
        {active && tooltip.index !== null && (
          <ChartTooltip
            id={tooltipId}
            x={(centreX(tooltip.index) / geometry.width) * 100}
            y={
              (y(Math.max(active.spentCents, active.budgetCents)) / HEIGHT) *
              100
            }
            title={formatMonth(active.month)}
            lines={[
              `Spent ${formatCents(active.spentCents)}`,
              active.budgetCents === 0
                ? 'No budgets set'
                : `Total budget ${formatCents(active.budgetCents)}`,
            ]}
          />
        )}
      </div>
      <p className={styles.key} aria-hidden="true">
        <span className={styles.keyBar} /> Spent
        <span className={styles.keyLine} /> Total budget
      </p>
      <TableToggle>
        <table className={parts.table}>
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
      </TableToggle>
    </div>
  )
}
