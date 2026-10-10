import { useCallback, useRef, useState } from 'react'

/**
 * The rendered width of an element in CSS pixels, kept up to date with a
 * ResizeObserver. Until it's measured (or where ResizeObserver doesn't
 * exist, as in tests) it is `fallback`. A zero width (a hidden element) is
 * ignored, so the last real width is kept.
 */
export function useElementWidth(fallback: number): {
  ref: (node: Element | null) => void
  width: number
} {
  const [width, setWidth] = useState<number | null>(null)
  const observer = useRef<ResizeObserver | null>(null)

  const ref = useCallback((node: Element | null) => {
    observer.current?.disconnect()
    observer.current = null
    if (!node || !('ResizeObserver' in window)) return
    const next = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width ?? 0
      if (measured > 0) setWidth(Math.round(measured))
    })
    next.observe(node)
    observer.current = next
  }, [])

  return { ref, width: width ?? fallback }
}
