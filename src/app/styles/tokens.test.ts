import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// jsdom can't compute custom properties from a stylesheet, so these read
// the file. Contrast is checked by hand (decisions.md, task 35).
const css = readFileSync(
  resolve(process.cwd(), 'src/app/styles/tokens.css'),
  'utf8',
)
const pinkBlock =
  /:root\[data-palette='pink'\] \{([^}]*)\}/.exec(css)?.[1] ?? ''

function declaredNames(block: string): string[] {
  return [...block.matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1] ?? '')
}

describe('the pink palette in tokens.css', () => {
  it('redefines the palette layer the sunset colours derive from', () => {
    expect(declaredNames(pinkBlock)).toEqual(
      expect.arrayContaining([
        '--sunset-sky',
        '--sunset-peach',
        '--sunset-ember',
        '--tint-warm',
        '--tint-cool',
      ]),
    )
  })

  it('switches all six chart colours and keeps a red for over budget', () => {
    const names = declaredNames(pinkBlock)
    for (let i = 1; i <= 6; i++) expect(names).toContain(`--chart-${String(i)}`)
    expect(pinkBlock).toMatch(
      /--color-danger: light-dark\(oklch\(50% 0\.2 27\)/,
    )
  })

  it('only overrides colour tokens', () => {
    const nonColour = declaredNames(pinkBlock).filter(
      (name) => !/^--(sunset|tint|color|chart)-/.test(name),
    )
    expect(nonColour).toEqual([])
  })

  it('gives every override a light and a dark value', () => {
    const colours = pinkBlock
      .split(/;\s*/)
      .filter((decl) => /--(sunset|color|chart)-/.test(decl))
    expect(colours.length).toBeGreaterThan(0)
    for (const decl of colours) expect(decl).toContain('light-dark(')
  })
})
