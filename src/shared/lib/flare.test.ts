import { describe, expect, it } from 'vitest'
import { flareOrigin } from './flare'

const box = { left: 100, top: 50, width: 160, height: 44 }

describe('flareOrigin', () => {
  it('bursts from where the pointer clicked', () => {
    expect(flareOrigin({ detail: 1, clientX: 130, clientY: 60 }, box)).toEqual({
      x: 30,
      y: 10,
    })
  })

  it('bursts from the centre for a keyboard click', () => {
    expect(flareOrigin({ detail: 0, clientX: 0, clientY: 0 }, box)).toEqual({
      x: 80,
      y: 22,
    })
  })

  it('keeps a pointer point inside the button', () => {
    expect(flareOrigin({ detail: 1, clientX: 10, clientY: 500 }, box)).toEqual({
      x: 0,
      y: 44,
    })
  })

  it('treats a double click like a single one', () => {
    expect(flareOrigin({ detail: 2, clientX: 260, clientY: 94 }, box)).toEqual({
      x: 160,
      y: 44,
    })
  })
})
