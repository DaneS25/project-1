import { useId, type PointerEvent } from 'react'
import { useFirstView } from '@/shared/hooks/useFirstView'
import { formatCents } from '@/shared/lib/money'
import type { Id } from '@/shared/types'
import { donutSegments, sliceColour } from '../logic/donut'
import { formatShare } from '../logic/format'
import type { SpendingBreakdown } from '../logic/insights'
import { breakdownSummary } from '../logic/summaries'
import parts from './ChartParts.module.css'
import { ChartTooltip } from './ChartTooltip'
import { TableToggle } from './TableToggle'
import styles from './DonutChart.module.css'
import { isHoverPointer, useTooltip } from './useTooltip'

type DonutChartProps = {
  breakdown: SpendingBreakdown
  /** The month shown, for the chart's accessible name, e.g. "October 2026". */
  monthLabel: string
}

type Active = {
  id: Id
  /** Whether the tooltip shows too (a slice hovered or a row focused). */
  tip: boolean
}

/**
 * "Where the money went": a donut of spending by category with the total
 * in the centre, and a legend listing every category's amount and share,
 * largest first. Colour is never the only cue: the legend names each
 * slice. Hovering a slice or legend row with a mouse, or focusing a legend
 * row with the keyboard, highlights the pair. Hovering a slice or focusing
 * a row also opens a tooltip above the donut (Escape closes it). A summary
 * sentence leads, and "Show as table" gives the figures as a table.
 */
export function DonutChart({ breakdown, monthLabel }: DonutChartProps) {
  const { active, setActive } = useTooltip<Active>()
  const { ref: viewRef, seen } = useFirstView()
  const tooltipId = useId()
  const { items, totalCents } = breakdown
  const segments = donutSegments(
    items.map((item) => item.spentCents),
    totalCents,
  )
  const total = formatCents(totalCents)
  const label = `Spending by category in ${monthLabel}: ${total} in total.`
  const tipItem = active?.tip
    ? items.find((item) => item.category.id === active.id)
    : undefined

  function state(id: Id) {
    if (active === null) return undefined
    return active.id === id ? 'active' : 'dimmed'
  }

  return (
    <div ref={viewRef} className={styles.root} data-seen={seen || undefined}>
      <p className={parts.summary}>{breakdownSummary(breakdown)}</p>
      <div className={styles.chart}>
        <div
          className={[styles.donut, parts.area].join(' ')}
          // Leaving the donut and its tooltip closes the tooltip; moving
          // onto the tooltip doesn't (WCAG 1.4.13, hoverable).
          onPointerLeave={(event: PointerEvent) => {
            if (isHoverPointer(event) && active?.tip) setActive(null)
          }}
        >
          <svg
            className={styles.svg}
            viewBox="0 0 100 100"
            role="img"
            aria-label={label}
          >
            <g className={styles.ring}>
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
                      onPointerEnter={(event) => {
                        if (isHoverPointer(event)) {
                          setActive({ id: item.category.id, tip: true })
                        }
                      }}
                    />
                  )
                })}
              </g>
            </g>
          </svg>
          <p className={styles.centre} aria-hidden="true">
            <span className={styles.centreLabel}>Total</span>
            <span className={styles.centreAmount}>{total}</span>
          </p>
          {tipItem && (
            <ChartTooltip
              id={tooltipId}
              x={50}
              y={0}
              flush
              title={tipItem.category.name}
              lines={[
                `${formatCents(tipItem.spentCents)}, ${formatShare(tipItem.spentCents, totalCents) ?? ''}`,
              ]}
            />
          )}
        </div>
        <ul className={styles.legend} aria-label="Categories, largest first">
          {items.map((item, index) => (
            <li
              key={item.category.id}
              className={styles.row}
              data-state={state(item.category.id)}
              // Focusable so keyboard users can highlight a slice.
              tabIndex={0}
              aria-describedby={
                active?.id === item.category.id && active.tip
                  ? tooltipId
                  : undefined
              }
              onFocus={() => {
                setActive({ id: item.category.id, tip: true })
              }}
              onBlur={() => {
                setActive(null)
              }}
              // A row already shows its figures, so hovering it only
              // highlights the pair; no tooltip.
              onPointerEnter={(event) => {
                if (isHoverPointer(event)) {
                  setActive({ id: item.category.id, tip: false })
                }
              }}
              onPointerLeave={(event) => {
                if (isHoverPointer(event)) setActive(null)
              }}
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
      <TableToggle>
        <table className={parts.table}>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Spent</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.category.id}>
                <th scope="row">{item.category.name}</th>
                <td>{formatCents(item.spentCents)}</td>
                <td>{formatShare(item.spentCents, totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableToggle>
    </div>
  )
}
