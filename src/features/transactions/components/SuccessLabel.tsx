import { usePalette } from '@/shared/hooks/usePalette'
import { CuteIcon } from '@/shared/components/icons/CuteIcon'
import styles from './SuccessLabel.module.css'

type SuccessLabelProps = {
  label: string
  /** True while the success check shows in place of the label. */
  isDone: boolean
}

/**
 * A button label that can briefly give way to a glowing check (a heart in
 * pink mode). The label
 * text stays in place (only faded), so the button keeps its size and its
 * accessible name; the check is decorative, and the form's status message
 * does the announcing.
 */
export function SuccessLabel({ label, isDone }: SuccessLabelProps) {
  const isPink = usePalette() === 'pink'

  return (
    <span className={styles.wrap} data-done={isDone ? '' : undefined}>
      <span className={styles.label}>{label}</span>
      <span className={styles.check} aria-hidden="true">
        <span className={styles.glow} />
        {isPink ? (
          <CuteIcon name="heart" size={22} className={styles.heart} />
        ) : (
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            width="22"
            height="22"
            focusable="false"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
    </span>
  )
}
