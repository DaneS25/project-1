type MatchMediaHost = { matchMedia?: (query: string) => { matches: boolean } }

/**
 * True when it's safe to play an exit animation that holds an element on
 * screen: the browser can tell us the motion preference (feature-detected)
 * and the user hasn't asked for reduced motion. When in doubt, it says no,
 * so the element is removed straight away.
 */
export function canAnimateExit(host: MatchMediaHost = window): boolean {
  if (typeof host.matchMedia !== 'function') return false
  return !host.matchMedia('(prefers-reduced-motion: reduce)').matches
}
