import {
  useEffect,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

/**
 * Which item a chart tooltip shows, if any. While one is open, Escape
 * anywhere closes it (WCAG 1.4.13: dismissible without moving the pointer
 * or focus).
 */
export function useTooltip<K>() {
  const [active, setActive] = useState<K | null>(null)

  useEffect(() => {
    if (active === null) return
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setActive(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [active])

  return { active, setActive }
}

/** Hover with a mouse or pen; a tap shouldn't leave a tooltip stuck open. */
export function isHoverPointer(event: PointerEvent): boolean {
  return event.pointerType !== 'touch'
}

/**
 * A tooltip over a row of month points (bars or markers). The chart is
 * one tab stop: focusing it opens the selected (last) month, Left/Right/
 * Home/End move along, and Escape closes. Hovering a month's slot opens
 * it; it stays open while the pointer is over the chart or the tooltip
 * itself (hoverable), and closes when the pointer leaves both.
 */
export function useMonthTooltip(count: number) {
  const { active, setActive } = useTooltip<number>()
  // A range change can leave an index past the end; treat it as closed.
  const index = active !== null && active < count ? active : null

  function onKeyDown(event: KeyboardEvent) {
    const from = index ?? count - 1
    const moves: Partial<Record<string, number>> = {
      ArrowLeft: Math.max(0, from - 1),
      ArrowRight: Math.min(count - 1, from + 1),
      Home: 0,
      End: count - 1,
    }
    const next = moves[event.key]
    if (next === undefined) return
    // Keep the arrows from also moving the chart carousel.
    event.preventDefault()
    event.stopPropagation()
    setActive(next)
  }

  return {
    index,
    /** For the focusable chart (the SVG). */
    focusProps: {
      tabIndex: 0,
      onFocus: () => {
        setActive(count - 1)
      },
      onBlur: () => {
        setActive(null)
      },
      onKeyDown,
    },
    /** For the box around the chart and its tooltip. */
    areaProps: {
      onPointerLeave: (event: PointerEvent) => {
        if (isHoverPointer(event)) setActive(null)
      },
    },
    /** For a month's hover target. */
    hoverProps: (month: number) => ({
      onPointerEnter: (event: PointerEvent) => {
        if (isHoverPointer(event)) setActive(month)
      },
    }),
  }
}
