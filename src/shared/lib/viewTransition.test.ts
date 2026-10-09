import { describe, expect, it, vi } from 'vitest'
import { withViewTransition, type ViewTransitionHost } from './viewTransition'

const motionOk = { matchMedia: () => ({ matches: false }) }
const reducedMotion = { matchMedia: () => ({ matches: true }) }

function fakeHost() {
  const resolvers: { resolve?: (value: unknown) => void } = {}
  const finished = new Promise<unknown>((resolve) => {
    resolvers.resolve = resolve
  })
  const dataset: DOMStringMap = {}
  const host = {
    documentElement: { dataset },
    startViewTransition: vi.fn((update: () => void) => {
      update()
      return { finished }
    }),
  } satisfies ViewTransitionHost
  return {
    host,
    finish: () => {
      resolvers.resolve?.(undefined)
    },
  }
}

describe('withViewTransition', () => {
  it('runs the update inside a view transition and names the direction', () => {
    const { host } = fakeHost()
    const update = vi.fn()

    withViewTransition(update, 'next', host, motionOk)

    expect(host.startViewTransition).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledOnce()
    expect(host.documentElement.dataset.transition).toBe('next')
  })

  it('clears the direction when the transition finishes', async () => {
    const { host, finish } = fakeHost()

    withViewTransition(vi.fn(), 'previous', host, motionOk)
    finish()
    await Promise.resolve()
    await Promise.resolve()

    expect(host.documentElement.dataset.transition).toBeUndefined()
  })

  it('keeps the direction while a newer transition in the same direction plays', async () => {
    const finishes: (() => void)[] = []
    const dataset: DOMStringMap = {}
    const host: ViewTransitionHost = {
      documentElement: { dataset },
      startViewTransition: (update) => {
        update()
        const finished = new Promise((resolve) => {
          finishes.push(() => {
            resolve(undefined)
          })
        })
        return { finished }
      },
    }

    withViewTransition(vi.fn(), 'next', host, motionOk)
    withViewTransition(vi.fn(), 'next', host, motionOk)
    finishes[0]?.()
    await Promise.resolve()
    await Promise.resolve()
    expect(dataset.transition).toBe('next')

    finishes[1]?.()
    await Promise.resolve()
    await Promise.resolve()
    expect(dataset.transition).toBeUndefined()
  })

  it('just runs the update when the browser has no View Transitions API', () => {
    const dataset: DOMStringMap = {}
    const host: ViewTransitionHost = { documentElement: { dataset } }
    const update = vi.fn()

    withViewTransition(update, 'next', host, motionOk)

    expect(update).toHaveBeenCalledOnce()
    expect(host.documentElement.dataset.transition).toBeUndefined()
  })

  it('just runs the update with reduced motion', () => {
    const { host } = fakeHost()
    const update = vi.fn()

    withViewTransition(update, 'next', host, reducedMotion)

    expect(host.startViewTransition).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledOnce()
  })
})
