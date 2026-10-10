import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Button } from '@/shared/components/Button'
import styles from './ChartCarousel.module.css'

export type ChartSlide = {
  id: string
  title: string
  content: ReactNode
}

/**
 * Longest a button- or key-started scroll keeps ignoring scroll events if
 * the browser never sends scrollend (a smooth scroll is well under this).
 */
export const SCROLL_GUARD_MS = 800

type ChartCarouselProps = {
  slides: readonly ChartSlide[]
}

/**
 * A horizontal, scroll-snapped strip of chart cards. Swipe or scroll it, use
 * Previous and Next, pick a numbered dot, or use the arrow keys (and Home
 * and End) while the strip has focus. Only the current card is exposed to
 * screen readers and keyboard focus; its name is announced on change.
 */
export function ChartCarousel({ slides }: ChartCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const trackRef = useRef<HTMLDivElement>(null)
  // The latest current index, for handlers and timers that run between
  // renders.
  const currentRef = useRef(0)
  // While a button or key scrolls the strip, ignore the scroll events it
  // causes, so the announcement doesn't flick through every card. The
  // guard is released when the scroll ends (or after a fallback time).
  const scrollTarget = useRef<number | null>(null)
  const guardTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const id = useId()
  const count = slides.length

  // An allowed effect: clears the guard's fallback timer on unmount.
  useEffect(
    () => () => {
      clearTimeout(guardTimer.current)
    },
    [],
  )

  function show(index: number) {
    const slide = slides[index]
    if (!slide || index === currentRef.current) return
    currentRef.current = index
    setCurrent(index)
    setAnnouncement(
      `Chart ${String(index + 1)} of ${String(count)}: ${slide.title}`,
    )
  }

  /** The card the strip is actually scrolled to, or null if unmeasurable. */
  function scrolledIndex(): number | null {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return null
    const index = Math.round(track.scrollLeft / track.clientWidth)
    return Math.min(Math.max(index, 0), count - 1)
  }

  /**
   * Ends a button- or key-started scroll: drops the guard and makes the
   * current card match where the strip really is (a swipe may have taken
   * over part-way).
   */
  function releaseGuard() {
    if (scrollTarget.current === null) return
    scrollTarget.current = null
    clearTimeout(guardTimer.current)
    const index = scrolledIndex()
    if (index !== null) show(index)
  }

  function goTo(index: number) {
    const target = Math.min(Math.max(index, 0), count - 1)
    if (target === currentRef.current) return
    show(target)
    const track = trackRef.current
    if (track && typeof track.scrollTo === 'function') {
      scrollTarget.current = target
      clearTimeout(guardTimer.current)
      guardTimer.current = setTimeout(releaseGuard, SCROLL_GUARD_MS)
      // CSS makes this smooth only when motion is allowed.
      track.scrollTo({ left: target * track.clientWidth })
    }
  }

  function handleScroll() {
    const index = scrolledIndex()
    if (index === null) return
    if (scrollTarget.current !== null) {
      if (index === scrollTarget.current) releaseGuard()
      return
    }
    show(index)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Partial<Record<string, number>> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: count - 1,
    }
    const target = moves[event.key]
    if (target === undefined) return
    event.preventDefault()
    goTo(target)
  }

  return (
    <div className={styles.carousel}>
      <div
        ref={trackRef}
        className={styles.track}
        role="region"
        aria-roledescription="carousel"
        aria-label="Charts"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        onScrollEnd={releaseGuard}
      >
        {slides.map((slide, index) => {
          const isCurrent = index === current
          return (
            <section
              key={slide.id}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-labelledby={`${id}-${slide.id}`}
              aria-hidden={isCurrent ? undefined : true}
              inert={!isCurrent}
            >
              <h3 id={`${id}-${slide.id}`} className={styles.title}>
                {slide.title}
              </h3>
              {slide.content}
            </section>
          )
        })}
      </div>
      <div className={styles.controls}>
        <Button
          variant="outline"
          size="small"
          aria-label="Previous chart"
          aria-disabled={current === 0 || undefined}
          onClick={() => {
            goTo(current - 1)
          }}
        >
          <span aria-hidden="true">‹</span>
        </Button>
        <div className={styles.dots} role="group" aria-label="Choose a chart">
          {slides.map((slide, index) => (
            <Button
              key={slide.id}
              variant="outline"
              size="small"
              aria-label={`${slide.title}, chart ${String(index + 1)} of ${String(count)}`}
              aria-current={index === current ? 'true' : undefined}
              onClick={() => {
                goTo(index)
              }}
            >
              {index + 1}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="small"
          aria-label="Next chart"
          aria-disabled={current === count - 1 || undefined}
          onClick={() => {
            goTo(current + 1)
          }}
        >
          <span aria-hidden="true">›</span>
        </Button>
      </div>
      <p className={styles.visuallyHidden} role="status">
        {announcement}
      </p>
    </div>
  )
}
