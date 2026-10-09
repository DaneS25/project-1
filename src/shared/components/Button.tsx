import type { ComponentProps, MouseEvent } from 'react'
import { flareOrigin } from '@/shared/lib/flare'
import styles from './Button.module.css'

type ButtonProps = ComponentProps<'button'> & {
  /**
   * primary: the main action (sunset gradient). secondary: a plain
   * alternative such as Cancel. danger: a destructive confirm. outline and
   * outline-danger: small row actions such as Edit and Delete.
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'outline-danger'
  size?: 'regular' | 'small'
}

/**
 * The app's button. Every variant shares the press and hover feel: a slight
 * press-down, and a lift with a shadow on pointer hover. Motion is off with
 * reduced motion, leaving only the colour change. Defaults to
 * `type="button"` so it never submits a form by accident. `className` is for
 * layout only (placement, spacing); colours always come from `variant`.
 *
 * A primary button also bursts a "sun flare" glow from the click point (the
 * centre for Enter or Space). The click goes on to `onClick` at once; the
 * glow is CSS only and never delays or resizes the button.
 */
export function Button({
  variant = 'secondary',
  size = 'regular',
  type = 'button',
  className,
  onClick,
  ...props
}: ButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (variant === 'primary') startFlare(event)
    onClick?.(event)
  }

  return (
    <button
      type={type}
      className={[styles.button, styles[variant], styles[size], className]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      {...props}
    />
  )
}

/**
 * Places the flare at the click point and restarts its animation. Two
 * identical animations alternate on `data-flare`, so every click replays
 * it without forcing a reflow.
 */
function startFlare(event: MouseEvent<HTMLButtonElement>) {
  const button = event.currentTarget
  const { x, y } = flareOrigin(event, button.getBoundingClientRect())
  button.style.setProperty('--flare-x', `${String(x)}px`)
  button.style.setProperty('--flare-y', `${String(y)}px`)
  button.dataset.flare = button.dataset.flare === 'a' ? 'b' : 'a'
}
