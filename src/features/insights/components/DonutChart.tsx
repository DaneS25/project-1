import { useState, type PointerEvent } from 'react'
import { formatCents } from '@/shared/lib/money'
import type { Id } from '@/shared/types'
import { donutSegments, sliceColour } from '../logic/donut'
import { formatShare } from '../logic/format'
import type { SpendingBreakdown } from '../logic/insights'
import styles from './DonutChart.module.css'

type DonutChartProps = {
  breakdown: SpendingBreakdown
  /** The month shown, for the chart's accessible name, e.g. "October 2026". */
  monthLabel: string
}

/**
 * "Where the money went": a donut of spending by category with the total
 * in the centre, and a legend listing every category's amount and share,
 * largest first. Colour is never the only cue: the legend names each
 * slice. Hovering a slice or legend row with a mouse, or focusing a legend
 * row with the keyboard, highlights the pair.
 */
export function DonutChart({ breakdown, monthLabel }: DonutChartProps) {
  const [activeId, setActiveId] = useState<Id | null>(null)
  const { items, totalCents } = breakdown
  const segments = donutSegments(
    items.map((item) => item.spentCents),
    totalCents,
  )
  const total = formatCents(totalCents)

  // Pointer hover counts only for a mouse, so a tap doesn't leave a
  // highlight stuck on a touch screen (keyboard focus still works).
  function hover(id: Id) {
    return {
      onPointerEnter: (event: PointerEvent) => {
        if (event.pointerType === 'mouse') setActiveId(id)
      },
      onPointerLeave: (event: PointerEvent) => {
        if (event.pointerType === 'mouse') setActiveId(null)
      },
    }
  }

  function state(id: Id) {
    if (activeId === null) return undefined
    return activeId === id ? 'active' : 'dimmed'
  }

  return (
    <div className={styles.chart}>
      <div className={styles.donut}>
        <svg
          className={styles.svg}
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Spending by category in ${monthLabel}: ${total} in total.`}
        >
          <g transform="rotate(-90 50 50)">
            {items.map((item, index) => {
              const segment = segments[index]
              if (!segment) return null
              return (
                <circle
                  key={item.category.id}
                  className={styles.slice}
                  data-state={state(item.category.id)}
                  cx="50"
                  cy="50"
                  r="40"
                  pathLength="100"
                  style={{ stroke: sliceColour(index) }}
                  strokeDasharray={`${String(segment.length)} ${String(100 - segment.length)}`}
                  strokeDashoffset={String(-segment.start)}
                  {...hover(item.category.id)}
                />
              )
            })}
          </g>
        </svg>
        <p className={styles.centre} aria-hidden="true">
          <span className={styles.centreLabel}>Total</span>
          <span className={styles.centreAmount}>{total}</span>
        </p>
      </div>
      <ul className={styles.legend} aria-label="Categories, largest first">
        {items.map((item, index) => (
          <li
            key={item.category.id}
            className={styles.row}
            data-state={state(item.category.id)}
            // Focusable so keyboard users can highlight a slice.
            tabIndex={0}
            onFocus={() => {
              setActiveId(item.category.id)
            }}
            onBlur={() => {
              setActiveId(null)
            }}
            {...hover(item.category.id)}
          >
            <span
              className={styles.swatch}
              style={{ background: sliceColour(index) }}
              aria-hidden="true"
            />
            <span className={styles.name}>{item.category.name}</span>
            <span className={styles.amount}>
              {formatCents(item.spentCents)}
            </span>
            <span className={styles.share}>
              {formatShare(item.spentCents, totalCents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
