import { describe, expect, it } from 'vitest'
import { parseAppData } from '@/shared/storage/validate'
import { createDefaultData } from './defaultData'

function createTestIds() {
  let next = 0
  return () => {
    next += 1
    return `id-${String(next)}`
  }
}

describe('createDefaultData', () => {
  it('seeds each default category with its emoji and no budget', () => {
    const data = createDefaultData(createTestIds())

    expect(
      data.categories.map(({ name, emoji, monthlyBudgetCents }) => ({
        name,
        emoji,
        monthlyBudgetCents,
      })),
    ).toEqual([
      { name: 'Groceries', emoji: '🛒', monthlyBudgetCents: 0 },
      { name: 'Rent', emoji: '🏠', monthlyBudgetCents: 0 },
      { name: 'Transport', emoji: '🚌', monthlyBudgetCents: 0 },
      { name: 'Eating out', emoji: '🍜', monthlyBudgetCents: 0 },
      { name: 'Utilities', emoji: '💡', monthlyBudgetCents: 0 },
      { name: 'Other', emoji: '✨', monthlyBudgetCents: 0 },
    ])
    expect(data.transactions).toEqual([])
  })

  it('produces data that passes validation', () => {
    expect(parseAppData(createDefaultData(createTestIds())).ok).toBe(true)
  })
})
