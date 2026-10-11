import type { FieldErrors } from '@/shared/hooks/useFormDraft'
import { isCategoryNameTaken } from '@/shared/lib/categories'
import { isCategoryEmoji } from '@/shared/lib/emoji'
import { parseAmountToCents, type AmountError } from '@/shared/lib/money'
import type { Category, Cents, Id, Result } from '@/shared/types'

/** What the user has typed into a category form, before validation. */
export type CategoryDraft = {
  name: string
  budget: string
  /** The chosen emoji, or '' for none. */
  emoji: string
}

/** A blank draft for the add form. */
export const EMPTY_CATEGORY_DRAFT: CategoryDraft = {
  name: '',
  budget: '',
  emoji: '',
}

export type BudgetError =
  Exclude<AmountError, 'empty' | 'notPositive'> | 'negative'

/**
 * Parses a monthly budget. Unlike an expense amount, a blank or zero
 * budget is allowed and means "no budget set" (0 cents). Negative amounts
 * and malformed input are rejected with the same rules as
 * `parseAmountToCents`.
 */
export function parseBudgetToCents(input: string): Result<Cents, BudgetError> {
  const text = input.trim()
  if (text === '') return { ok: true, value: 0 }

  const result = parseAmountToCents(text)
  if (result.ok) return result
  switch (result.error) {
    case 'notPositive':
      // parseAmountToCents uses this for both zero and negative amounts.
      return text.includes('-')
        ? { ok: false, error: 'negative' }
        : { ok: true, value: 0 }
    case 'empty':
      return { ok: true, value: 0 }
    case 'invalid':
    case 'badGrouping':
    case 'tooManyDecimals':
    case 'tooLarge':
      return { ok: false, error: result.error }
    default: {
      const unhandled: never = result.error
      return unhandled
    }
  }
}

/**
 * Checks a draft and turns it into a category (without an id). The name is
 * trimmed, required and must not match another category's name, ignoring
 * case (`exceptId` is the category being edited). The emoji is optional:
 * '' means none, anything else must be a single emoji.
 */
export function validateCategoryDraft(
  draft: CategoryDraft,
  categories: readonly Category[],
  exceptId?: Id,
): Result<Omit<Category, 'id'>, FieldErrors<CategoryDraft>> {
  const errors: FieldErrors<CategoryDraft> = {}

  const name = draft.name.trim()
  if (name === '') {
    errors.name = 'Enter a name.'
  } else if (isCategoryNameTaken(categories, name, exceptId)) {
    errors.name = 'Another category already has this name.'
  }

  const budget = parseBudgetToCents(draft.budget)
  if (!budget.ok) errors.budget = budgetErrorMessage(budget.error)

  const emoji = draft.emoji
  if (emoji !== '' && !isCategoryEmoji(emoji)) {
    errors.emoji = 'Choose an emoji from the list, or None.'
  }

  if (!budget.ok || Object.keys(errors).length > 0) {
    return { ok: false, error: errors }
  }
  const category = { name, monthlyBudgetCents: budget.value }
  return { ok: true, value: emoji === '' ? category : { ...category, emoji } }
}

function budgetErrorMessage(error: BudgetError): string {
  switch (error) {
    case 'invalid':
      return 'Enter the budget as a number, like 400 or 400.00.'
    case 'badGrouping':
      return 'Check the commas in the budget, like 1,250.00.'
    case 'tooManyDecimals':
      return 'Use no more than 2 decimal places.'
    case 'negative':
      return 'The budget can’t be negative.'
    case 'tooLarge':
      return 'That budget is too large.'
    default: {
      const unhandled: never = error
      return unhandled
    }
  }
}
