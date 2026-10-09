import { useEffect, useState } from 'react'

/** How long the success check shows before the label comes back. */
export const FLOURISH_MS = 1200

/**
 * A brief "done" state for a button: `start()` turns it on, and it turns
 * itself off after FLOURISH_MS. Starting again while it's showing restarts
 * the timer, so quick repeat adds each get their full moment.
 */
export function useFlourish() {
  const [isShowing, setIsShowing] = useState(false)
  // Bumped on every start so the effect restarts the timer each time.
  const [runId, setRunId] = useState(0)

  // An allowed effect: it syncs with a timer outside React.
  useEffect(() => {
    if (runId === 0) return
    const timer = setTimeout(() => {
      setIsShowing(false)
    }, FLOURISH_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [runId])

  function start() {
    setIsShowing(true)
    setRunId((id) => id + 1)
  }

  return { isShowing, start }
}
