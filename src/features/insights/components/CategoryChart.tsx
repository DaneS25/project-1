import { useId, useState } from 'react'
import formStyles from '@/shared/components/Form.module.css'
import { sortCategoriesByName } from '@/shared/lib/categories'
import { formatMonth } from '@/shared/lib/dates'
import { formatCents } from '@/shared/lib/money'
import type { AppData, Id, MonthKey } from '@/shared/types'
import { defaultCategoryId } from '../logic/category'
import { categoryMonthlyTotals } from '../logic/insights'
import { niceScale } from '../logic/trend'
import {
  AmountGrid,
  HEIGHT,
  MonthLabels,
  WIDTH,
  monthGeometry,
} from './MonthAxes'
import { RangeToggle, type ChartRange } from './RangeToggle'
import styles from './CategoryChart.module.css'

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
 * A visually hidden table gives the same figures as text.
 */
export function CategoryChart({ data, month }: CategoryChartProps) {
  const selectId = useId()
  const [range, setRange] = useState<ChartRange>(6)
  // The user's pick, if any; otherwise follow the month's default.
  const [chosenId, setChosenId] = useState<Id | null>(null)
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
  const geometry = monthGeometry(months.length, scale)
  const { y, centreX } = geometry
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

  return (
    <div className={styles.chart}>
      {picker}
      <svg
        className={styles.svg}
        viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
        role="img"
        aria-label={`${label}. ${budgetText}. The table that follows lists each month.`}
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
        <g key={`${categoryId}-${String(range)}`} className={styles.series}>
          <polyline
            className={styles.line}
            points={points
              .map((p) => `${String(p.x)},${String(p.y)}`)
              .join(' ')}
          />
          {points.map((p) => (
            <circle
              key={p.month}
              className={styles.marker}
              data-month={p.month}
              data-selected={p.month === month || undefined}
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
      </svg>
      <p className={styles.key} aria-hidden="true">
        <span className={styles.keyLine} /> Spent
        <span>
          {budgetCents !== null && <span className={styles.keyBudget} />}
          {budgetText}
        </span>
      </p>
      <table className={styles.visuallyHidden}>
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
    </div>
  )
}
