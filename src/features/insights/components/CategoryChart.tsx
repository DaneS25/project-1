import { useId, useState } from 'react'
import formStyles from '@/shared/components/Form.module.css'
import { useElementWidth } from '@/shared/hooks/useElementWidth'
import { useFirstView } from '@/shared/hooks/useFirstView'
import { sortCategoriesByName } from '@/shared/lib/categories'
import { formatMonth } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import type { AppData, Id, MonthKey } from '@/shared/types'
import { defaultCategoryId } from '../logic/category'
import { categoryMonthlyTotals } from '../logic/insights'
import { categorySummary } from '../logic/summaries'
import { niceScale } from '../logic/trend'
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
import styles from './CategoryChart.module.css'
import { useMonthTooltip } from './useTooltip'

type CategoryChartProps = {
  data: AppData
  /** The selected month: the last point, highlighted. */
  month: MonthKey
}

/**
 * "Category over time": one category's spending per month for the 6 or 12
 * months up to the selected one, as a line with a marker on every month,
 * and its budget as a dashed level line when one is set. The category is
 * picked from a native select; it opens on the month's largest category.
 * A summary sentence leads, a tooltip gives each month's figure on hover
 * or keyboard focus, and "Show as table" lists them all.
 */
export function CategoryChart({ data, month }: CategoryChartProps) {
  const selectId = useId()
  const tooltipId = useId()
  const hintId = useId()
  const [range, setRange] = useState<ChartRange>(6)
  // The user's pick, if any; otherwise follow the month's default.
  const [chosenId, setChosenId] = useState<Id | null>(null)
  const { ref: areaRef, width } = useElementWidth(DEFAULT_WIDTH)
  const { ref: viewRef, seen } = useFirstView()
  const tooltip = useMonthTooltip(range)
  const categories = sortCategoriesByName(data.categories)
  const categoryId = categories.some((c) => c.id === chosenId)
    ? chosenId
    : defaultCategoryId(data, month)

  if (categoryId === null) {
    return (
      <p className={styles.message}>
        Add a category to see its spending over time.
      </p>
    )
  }

  const picker = (
    <div className={styles.controls}>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor={selectId}>
          Category
        </label>
        <select
          id={selectId}
          className={formStyles.control}
          value={categoryId}
          onChange={(e) => {
            setChosenId(e.target.value)
          }}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <RangeToggle range={range} onChange={setRange} />
    </div>
  )

  const result = categoryMonthlyTotals(data, categoryId, month, range)
  if (!result.ok) {
    return (
      <div className={styles.chart}>
        {picker}
        <p className={styles.message}>
          These totals are too large to chart. Check for an amount entered by
          mistake.
        </p>
      </div>
    )
  }

  const { category, budgetCents, months } = result.value
  const max = Math.max(budgetCents ?? 0, ...months.map((m) => m.spentCents))
  const scale = niceScale(max)
  // Geometry only: floats are fine from here on.
  const geometry = monthGeometry(months.length, scale, width)
  const { y, centreX, slot, baseY } = geometry
  const points = months.map((m, index) => ({
    month: m.month,
    x: centreX(index),
    y: y(m.spentCents),
  }))
  const label = `Spending on ${category.name} for the ${String(range)} months to ${formatMonth(month)}`
  const budgetText =
    budgetCents === null
      ? 'No budget set'
      : `Current budget ${formatCents(budgetCents)} a month`
  const active = tooltip.index === null ? undefined : months[tooltip.index]
  const activePoint = tooltip.index === null ? undefined : points[tooltip.index]

  return (
    <div ref={viewRef} className={styles.chart} data-seen={seen || undefined}>
      {picker}
      <p className={parts.summary}>{categorySummary(result.value)}</p>
      <div ref={areaRef} className={parts.area} {...tooltip.areaProps}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${String(geometry.width)} ${String(HEIGHT)}`}
          role="img"
          aria-label={`${label}. ${budgetText}.`}
          aria-describedby={active ? `${tooltipId} ${hintId}` : hintId}
          {...tooltip.focusProps}
        >
          <AmountGrid scale={scale} geometry={geometry} />
          {budgetCents !== null && (
            <line
              className={styles.budgetLine}
              data-budget-line=""
              x1={geometry.left}
              x2={geometry.right}
              y1={y(budgetCents)}
              y2={y(budgetCents)}
            />
          )}
          {/* Keyed so a new category or range replays the entrance. */}
          <g key={`${categoryId}-${String(range)}`}>
            <polyline
              className={styles.line}
              points={points
                .map((p) => `${String(p.x)},${String(p.y)}`)
                .join(' ')}
            />
            {points.map((p, index) => (
              <circle
                key={p.month}
                className={styles.marker}
                data-month={p.month}
                data-selected={p.month === month || undefined}
                data-active={index === tooltip.index || undefined}
                cx={p.x}
                cy={p.y}
                r={p.month === month ? 5 : 3.5}
              />
            ))}
          </g>
          <MonthLabels
            months={months.map((m) => m.month)}
            selected={month}
            geometry={geometry}
          />
          {/* Invisible full-height slots, so a month is easy to hover. */}
          {points.map((p, index) => (
            <rect
              key={p.month}
              className={styles.hit}
              x={p.x - slot / 2}
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
        {active && activePoint && (
          <ChartTooltip
            id={tooltipId}
            x={(activePoint.x / geometry.width) * 100}
            // Above the marker's top edge (radius up to 5).
            y={((activePoint.y - 5) / HEIGHT) * 100}
            title={formatMonth(active.month)}
            lines={[`${category.name}: ${formatCents(active.spentCents)}`]}
          />
        )}
      </div>
      <p className={styles.key} aria-hidden="true">
        <span className={styles.keyLine} /> Spent
        <span>
          {budgetCents !== null && <span className={styles.keyBudget} />}
          {budgetText}
        </span>
      </p>
      <TableToggle>
        <table className={parts.table}>
          <caption>
            {label}. {budgetText}.
          </caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Spent</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month}>
                <th scope="row">
                  {formatMonth(m.month)}
                  {m.month === month ? ' (selected)' : ''}
                </th>
                <td>{formatCents(m.spentCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableToggle>
    </div>
  )
}
