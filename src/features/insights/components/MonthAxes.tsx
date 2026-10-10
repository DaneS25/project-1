import { formatMonth } from '@/shared/lib/dates'
import type { Cents, MonthKey } from '@/shared/types'
import { formatAxisAmount } from '../logic/format'
import type { NiceScale } from '../logic/trend'
import styles from './MonthAxes.module.css'

// Drawing area, in SVG units (the SVG scales to its width). Shared by the
// month-by-month charts so they line up when flicking between cards.
export const WIDTH = 360
export const HEIGHT = 200
const LEFT = 52
const RIGHT = 8
const TOP = 10
const BOTTOM = 26
const PLOT_W = WIDTH - LEFT - RIGHT
const PLOT_H = HEIGHT - TOP - BOTTOM

export type MonthGeometry = {
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

/** Geometry for `count` months on a `scale`. Floats from here on. */
export function monthGeometry(count: number, scale: NiceScale): MonthGeometry {
  const slot = PLOT_W / count
  return {
    slot,
    y: (cents) => TOP + PLOT_H - (cents / scale.topCents) * PLOT_H,
    centreX: (index) => LEFT + slot * index + slot / 2,
    baseY: TOP + PLOT_H,
    left: LEFT,
    right: WIDTH - RIGHT,
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
 * Month labels under the plot. The selected month's is bold; with 12
 * months every other label is dropped for space, but never the selected.
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
  return months.map((month, index) =>
    months.length > 6 && index % 2 === 1 && month !== selected ? null : (
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
