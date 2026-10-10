import { Fragment } from 'react'
import styles from './ChartParts.module.css'

type ChartTooltipProps = {
  id: string
  /** Where the described item is, as percentages of the chart box. */
  x: number
  y: number
  /**
   * Sit right against the point, with no gap, so the pointer can cross
   * from the chart onto the tooltip without leaving either.
   */
  flush?: boolean
  /** The bold first line, e.g. the month. */
  title: string
  /** The figures, one per line. */
  lines: readonly string[]
}

/**
 * A tooltip placed just above an item (a bar's top, a marker), so it never
 * covers the item it describes. Near either edge it lines up with that
 * edge instead of centring, so it stays inside the chart. It takes pointer
 * events, so the pointer can move onto it without it closing. Lines are
 * block spans with a space between, so the text reads as separate words
 * when it's used as a description.
 */
export function ChartTooltip({
  id,
  x,
  y,
  flush = false,
  title,
  lines,
}: ChartTooltipProps) {
  const align = x < 25 ? 'start' : x > 75 ? 'end' : 'centre'
  return (
    <div
      id={id}
      role="tooltip"
      className={styles.tooltip}
      data-align={align}
      data-flush={flush || undefined}
      style={{ left: `${String(x)}%`, top: `${String(y)}%` }}
    >
      <span className={styles.tooltipLine}>
        <strong>{title}</strong>
      </span>
      {lines.map((line) => (
        <Fragment key={line}>
          {' '}
          <span className={styles.tooltipLine}>{line}</span>
        </Fragment>
      ))}
    </div>
  )
}
