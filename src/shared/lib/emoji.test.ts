import { describe, expect, it } from 'vitest'
import {
  CATEGORY_EMOJIS,
  emojiName,
  isCategoryEmoji,
  MAX_EMOJI_LENGTH,
} from './emoji'

describe('isCategoryEmoji', () => {
  it.each(['🛒', '✨', '🛍️', '✈️', '👍🏽', '🇳🇿', '👩‍👩‍👧'])(
    'accepts the single emoji %s',
    (emoji) => {
      expect(isCategoryEmoji(emoji)).toBe(true)
    },
  )

  it('accepts every emoji offered in the picker', () => {
    expect(CATEGORY_EMOJIS.every((c) => isCategoryEmoji(c.emoji))).toBe(true)
  })

  it.each([
    ['an empty string', ''],
    ['two emojis', '🛒🏠'],
    ['a letter', 'a'],
    ['a digit', '1'],
    ['an emoji with text', '🛒 food'],
    ['an emoji with spaces around it', ' 🛒 '],
    ['a space', ' '],
  ])('rejects %s', (_label, value) => {
    expect(isCategoryEmoji(value)).toBe(false)
  })

  it('rejects anything longer than the length cap', () => {
    const long = '🛒' + '\u{1F3FD}'.repeat(MAX_EMOJI_LENGTH)
    expect(isCategoryEmoji(long)).toBe(false)
  })

  it.each([null, undefined, 5, {}, ['🛒']])(
    'rejects the non-string %j',
    (value) => {
      expect(isCategoryEmoji(value)).toBe(false)
    },
  )
})

describe('CATEGORY_EMOJIS', () => {
  it('has no repeated emoji or name', () => {
    const emojis = CATEGORY_EMOJIS.map((c) => c.emoji)
    const names = CATEGORY_EMOJIS.map((c) => c.name)
    expect(new Set(emojis).size).toBe(emojis.length)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('emojiName', () => {
  it('gives the picker name of an offered emoji', () => {
    expect(emojiName('🛒')).toBe('Shopping cart')
  })

  it('gives a generic name for an emoji not offered', () => {
    expect(emojiName('🦄')).toBe('Current emoji')
  })
})
