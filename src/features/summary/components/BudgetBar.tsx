import styles from './MonthlySummary.module.css'

type BudgetBarProps = {
  /** How full the bar is, from 0 to 1 (see `budgetFill`). */
  fill: number
}

/**
 * A decorative bar showing how much of a budget is spent; the text beside
 * it carries the figures. The fill is scaled with `transform: scaleX()`,
 * and its gradient is stretched by the inverse amount so it always spans
 * the whole track: a low bar shows only the blue end, warming to orange as
 * it fills.
 */
export function BudgetBar({ fill }: BudgetBarProps) {
  return (
    <div className={styles.bar} aria-hidden="true" data-testid="budget-bar">
      {fill > 0 && (
        <div
          className={styles.barFill}
          style={{
            transform: `scaleX(${String(fill)})`,
            backgroundSize: `${String(100 / fill)}% 100%`,
          }}
        />
      )}
    </div>
  )
}
