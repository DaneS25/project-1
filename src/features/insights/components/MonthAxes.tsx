import { formatMonth } from '@/shared/lib/dates'
import type { Cents, MonthKey } from '@/shared/types'
import { formatAxisAmount } from '../logic/format'
import type { NiceScale } from '../logic/trend'
import styles from './MonthAxes.module.css'

/**
 * The month-by-month charts are drawn at their real width (measured with
 * `useElementWidth`), so one SVG unit is one CSS pixel and the 12px axis
 * text stays 12px on a narrow phone instead of shrinking with the chart.
 * The default width is used before measuring and in tests.
 */
export const DEFAULT_WIDTH = 360
export const HEIGHT = 200
/**
 * Below this the plot gets too cramped and the SVG scales down. A 320px
 * phone leaves the card about 224px, so the text stays 12px there.
 */
const MIN_WIDTH = 200
const RIGHT = 8
const TOP = 12
const BOTTOM = 28
const PLOT_H = HEIGHT - TOP - BOTTOM
/** Roughly one 12px tabular character, for sizing the amount labels. */
const CHAR_WIDTH = 7
/** The room a month label needs ("Jan '27" at 12px), for thinning them. */
const MONTH_LABEL_WIDTH = 48

export type MonthGeometry = {
  /** The SVG's width in units (its CSS width once measured). */
  width: number
  /** Width of one month's slot. */
  slot: number
  /** The y coordinate of an amount. */
  y: (cents: Cents) => number
  /** The x coordinate of a month's centre, by index. */
  centreX: (index: number) => number
  /** The y coordinate of the axis line (0 cents). */
  baseY: number
  left: number
  right: number
}

/**
 * Geometry for `count` months on a `scale`, `measuredWidth` wide. The left
 * margin fits the longest amount label. Floats from here on.
 */
export function monthGeometry(
  count: number,
  scale: NiceScale,
  measuredWidth = DEFAULT_WIDTH,
): MonthGeometry {
  const width = Math.max(measuredWidth, MIN_WIDTH)
  const longest = Math.max(
    ...scale.ticks.map((tick) => formatAxisAmount(tick).length),
  )
  const left = longest * CHAR_WIDTH + 10
  const slot = (width - left - RIGHT) / count
  return {
    width,
    slot,
    y: (cents) => TOP + PLOT_H - (cents / scale.topCents) * PLOT_H,
    centreX: (index) => left + slot * index + slot / 2,
    baseY: TOP + PLOT_H,
    left,
    right: width - RIGHT,
  }
}

/** Horizontal gridlines with round NZD labels at each tick. */
export function AmountGrid({
  scale,
  geometry,
}: {
  scale: NiceScale
  geometry: MonthGeometry
}) {
  return scale.ticks.map((tick) => (
    <g key={tick}>
      <line
        className={styles.gridLine}
        x1={geometry.left}
        x2={geometry.right}
        y1={geometry.y(tick)}
        y2={geometry.y(tick)}
      />
      <text
        className={styles.axisLabel}
        x={geometry.left - 6}
        y={geometry.y(tick)}
        dy="0.32em"
        textAnchor="end"
      >
        {formatAxisAmount(tick)}
      </text>
    </g>
  ))
}

/**
 * Month labels under the plot, counted back from the selected (last) month
 * and thinned to every 2nd or 3rd when the slots are too narrow for them.
 * The selected month's label always shows, in bold.
 */
export function MonthLabels({
  months,
  selected,
  geometry,
}: {
  months: readonly MonthKey[]
  selected: MonthKey
  geometry: MonthGeometry
}) {
  const step = Math.max(1, Math.ceil(MONTH_LABEL_WIDTH / geometry.slot))
  const last = months.length - 1
  return months.map((month, index) =>
    (last - index) % step !== 0 && month !== selected ? null : (
      <text
        key={month}
        className={styles.monthLabel}
        data-selected={month === selected || undefined}
        x={geometry.centreX(index)}
        y={HEIGHT - 8}
        textAnchor="middle"
      >
        {shortMonth(month)}
      </text>
    ),
  )
}

/** "Oct", "Jan '27" (the year is added in January, so a long range reads). */
function shortMonth(month: MonthKey): string {
  const name = formatMonth(month).slice(0, 3)
  return month.endsWith('-01') ? `${name} '${month.slice(2, 4)}` : name
}
