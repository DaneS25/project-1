import { useCallback, useRef, useState } from 'react'

/**
 * Whether an element has been on screen yet (a quarter of it visible),
 * for entrance effects that should play on first view, not on mount.
 * Stays true once seen. Where IntersectionObserver doesn't exist (as in
 * tests) the element counts as seen straight away.
 */
export function useFirstView(): {
  ref: (node: Element | null) => void
  seen: boolean
} {
  const [seen, setSeen] = useState(() => !('IntersectionObserver' in window))
  const observer = useRef<IntersectionObserver | null>(null)

  const ref = useCallback((node: Element | null) => {
    observer.current?.disconnect()
    observer.current = null
    if (!node || !('IntersectionObserver' in window)) return
    const next = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true)
          next.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    next.observe(node)
    observer.current = next
  }, [])

  return { ref, seen }
}
