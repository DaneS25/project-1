import styles from './icons.module.css'

/**
 * Hand-drawn style paths on a 24-unit grid. Slightly uneven curves on
 * purpose, for a doodled look.
 */
const PATHS = {
  heart:
    'M12 19.6c-.4-.3-7.3-4.5-7.6-9.6-.2-2.7 1.7-4.8 4.1-4.8 1.6 0 2.8.9 3.5 2.2.7-1.3 1.9-2.2 3.5-2.2 2.4 0 4.3 2.1 4.1 4.8-.3 5.1-7.2 9.3-7.6 9.6Z',
  flower:
    'M12 9.4c-1-2.6-.6-5 1-5.2 1.5-.1 1.7 2.4.9 5.1 1.6-2.2 3.9-3.1 4.7-1.8.8 1.4-1.3 2.8-4 3.4 2.6.5 4.4 2 3.7 3.4-.7 1.3-3 .6-4.6-1.6.6 2.7.2 5-1.3 5.1-1.6.1-1.9-2.4-1.1-5-1.7 2.1-4 2.9-4.7 1.5-.7-1.4 1.2-2.8 3.8-3.4-2.6-.6-4.5-2.1-3.7-3.5.8-1.3 3.1-.4 4.5 1.9Z M12 13.2a1.2 1.2 0 1 0 .1 0',
  sparkle:
    'M12 3.5c.6 4 1.9 5.5 5.6 6.4-3.7.9-5 2.4-5.6 6.6-.6-4.2-1.9-5.7-5.6-6.6 3.7-.9 5-2.4 5.6-6.4Z M18.5 15.5c.2 1.4.7 2 2 2.3-1.3.3-1.8.9-2 2.4-.2-1.5-.7-2.1-2-2.4 1.3-.3 1.8-.9 2-2.3Z',
  star: 'M12 3.8l2.4 5 5.4.6-4 3.7 1.1 5.4L12 15.8l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6Z',
  piggyBank:
    'M5.6 11.2c.4-3.2 3.3-5.3 7-5.3 3.9 0 6.9 2.3 6.9 5.6 0 1.9-1 3.4-2.5 4.4v2.3h-2.4l-.5-1.4c-1 .2-2.3.2-3.3 0l-.5 1.4H7.9v-2.4c-.9-.6-1.6-1.3-2-2.2H4.4v-2.4ZM10.6 5.9c.2-1.1 1-1.8 2-1.8s1.8.7 2 1.8 M15.6 10.2h.1 M19.5 11.2c1 0 1.4-.6 1.4-1.3',
} as const

export type CuteIconName = keyof typeof PATHS

type CuteIconProps = {
  name: CuteIconName
  /** Pixel width and height; defaults to 20. */
  size?: number
  /** A light tint inside the outline. */
  isFilled?: boolean
  className?: string | undefined
}

/**
 * One of the app's small hand-drawn icons. Always decorative: hidden from
 * screen readers and never the only way something is said.
 */
export function CuteIcon({
  name,
  size = 20,
  isFilled = false,
  className,
}: CuteIconProps) {
  return (
    <svg
      className={[styles.icon, isFilled && styles.filled, className]
        .filter(Boolean)
        .join(' ')}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      data-icon={name}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
