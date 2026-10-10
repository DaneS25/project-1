import { Button } from '@/shared/components/Button'
import styles from './MonthAxes.module.css'

export const RANGES = [6, 12] as const
export type ChartRange = (typeof RANGES)[number]

type RangeToggleProps = {
  range: ChartRange
  onChange: (range: ChartRange) => void
}

/** "6 months" / "12 months": two toggle buttons with `aria-pressed`. */
export function RangeToggle({ range, onChange }: RangeToggleProps) {
  return (
    <div className={styles.toggle} role="group" aria-label="Months shown">
      {RANGES.map((value) => (
        <Button
          key={value}
          variant="outline"
          size="small"
          aria-pressed={range === value}
          onClick={() => {
            onChange(value)
          }}
        >
          {value} months
        </Button>
      ))}
    </div>
  )
}
