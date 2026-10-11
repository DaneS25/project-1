import type { ReactNode } from 'react'
import { usePalette } from '@/shared/hooks/usePalette'

type PinkDecorationProps = {
  /** An emoji or a `CuteIcon`; never words. */
  children: ReactNode
  className?: string | undefined
}

/**
 * A cute touch shown only with the pink palette. Hidden from screen readers,
 * so it never changes a heading's or button's name. Renders nothing in
 * sunset, so sunset stays exactly as it was.
 */
export function PinkDecoration({ children, className }: PinkDecorationProps) {
  const palette = usePalette()
  if (palette !== 'pink') return null
  return (
    <span className={className} aria-hidden="true" data-decoration="pink">
      {children}
    </span>
  )
}
