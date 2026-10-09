import { canAnimateExit } from './motion'

/** The parts of `document` this needs, so tests can pass a fake. */
export type ViewTransitionHost = {
  documentElement: { dataset: DOMStringMap }
  startViewTransition?: (update: () => void) => { finished: Promise<unknown> }
}

/**
 * Runs `update` inside a same-page view transition when the browser has
 * the View Transitions API and motion is allowed; otherwise just runs it.
 * While the transition plays, `data-transition` on <html> names its
 * direction, so CSS can pick the slide. `update` must apply its change
 * synchronously (wrap React updates in `flushSync`), because the browser
 * snapshots the new state as soon as the callback returns.
 */
export function withViewTransition(
  update: () => void,
  direction: string,
  host: ViewTransitionHost = document,
  motion: Parameters<typeof canAnimateExit>[0] = window,
): void {
  if (
    typeof host.startViewTransition !== 'function' ||
    !canAnimateExit(motion)
  ) {
    update()
    return
  }
  const { dataset } = host.documentElement
  dataset.transition = direction
  const transition = host.startViewTransition(update)
  latestTransition.set(host, transition)
  const clear = () => {
    // Only the latest transition clears the attribute; an earlier one
    // finishing (even in the same direction) must not cut a newer one short.
    if (latestTransition.get(host) !== transition) return
    latestTransition.delete(host)
    delete dataset.transition
  }
  void transition.finished.then(clear, clear)
}

/** The most recent transition started on each host. */
const latestTransition = new WeakMap<ViewTransitionHost, object>()
