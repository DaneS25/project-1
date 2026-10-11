/** Longest stored emoji, in UTF-16 code units (room for ZWJ sequences). */
export const MAX_EMOJI_LENGTH = 16

/** An emoji a category can use, with the text name screen readers get. */
export type EmojiChoice = {
  emoji: string
  name: string
}

/** The emojis offered in the category picker, in display order. */
export const CATEGORY_EMOJIS: readonly EmojiChoice[] = [
  { emoji: '🛒', name: 'Shopping cart' },
  { emoji: '🏠', name: 'House' },
  { emoji: '🚌', name: 'Bus' },
  { emoji: '🍜', name: 'Noodle bowl' },
  { emoji: '💡', name: 'Light bulb' },
  { emoji: '✨', name: 'Sparkles' },
  { emoji: '🚗', name: 'Car' },
  { emoji: '⛽', name: 'Fuel pump' },
  { emoji: '☕', name: 'Coffee' },
  { emoji: '🍕', name: 'Pizza' },
  { emoji: '🍎', name: 'Apple' },
  { emoji: '🛍️', name: 'Shopping bags' },
  { emoji: '👗', name: 'Dress' },
  { emoji: '💄', name: 'Lipstick' },
  { emoji: '💊', name: 'Pill' },
  { emoji: '🐶', name: 'Dog' },
  { emoji: '🐱', name: 'Cat' },
  { emoji: '👶', name: 'Baby' },
  { emoji: '🎁', name: 'Gift' },
  { emoji: '🎬', name: 'Film' },
  { emoji: '🎮', name: 'Video game' },
  { emoji: '📚', name: 'Books' },
  { emoji: '📱', name: 'Mobile phone' },
  { emoji: '✈️', name: 'Aeroplane' },
  { emoji: '💪', name: 'Flexed arm' },
  { emoji: '🌸', name: 'Blossom' },
  { emoji: '💖', name: 'Sparkling heart' },
  { emoji: '🐷', name: 'Pig' },
]

const PICTOGRAPHIC = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u

const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' })

/**
 * True for a single emoji: one grapheme, no longer than
 * `MAX_EMOJI_LENGTH` code units, that is pictographic (so plain letters,
 * digits and spaces are refused).
 */
export function isCategoryEmoji(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (value === '' || value.length > MAX_EMOJI_LENGTH) return false
  if (value.trim() !== value) return false
  let count = 0
  for (const segment of graphemes.segment(value)) {
    count += 1
    if (count > 1 || !PICTOGRAPHIC.test(segment.segment)) return false
  }
  return count === 1
}

/** The picker's name for an emoji, or a generic name for one not offered. */
export function emojiName(emoji: string): string {
  return (
    CATEGORY_EMOJIS.find((choice) => choice.emoji === emoji)?.name ??
    'Current emoji'
  )
}
