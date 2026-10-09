import type { ComponentProps } from 'react'
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
 */
export function Button({
  variant = 'secondary',
  size = 'regular',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[styles.button, styles[variant], styles[size], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
