import { useState, type SubmitEvent } from 'react'
import { Button } from '@/shared/components/Button'
import styles from '@/shared/components/Form.module.css'
import { useFormDraft } from '@/shared/hooks/useFormDraft'
import { useAppData } from '@/shared/store/AppDataContext'
import { describeBudget } from '../logic/budgetText'
import {
  validateCategoryDraft,
  type CategoryDraft,
} from '../logic/categoryDraft'
import { CategoryFields } from './CategoryFields'

type Outcome =
  { kind: 'idle' } | { kind: 'added'; message: string } | { kind: 'rejected' }

/** Form for adding a category with an optional monthly budget. */
export function CategoryForm() {
  const { data, addCategory } = useAppData()
  const form = useFormDraft<CategoryDraft>({ name: '', budget: '' })
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' })

  function handleChange(field: keyof CategoryDraft, value: string) {
    form.change(field, value)
    // Clear the last result once the next entry starts, so a repeated
    // message is announced again.
    if (outcome.kind !== 'idle') setOutcome({ kind: 'idle' })
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const category = form.check((draft) =>
      validateCategoryDraft(draft, data.categories),
    )
    if (!category) {
      setOutcome({ kind: 'idle' })
      return
    }
    if (!addCategory(category)) {
      setOutcome({ kind: 'rejected' })
      return
    }
    form.setDraft({ name: '', budget: '' })
    setOutcome({
      kind: 'added',
      message: `Added ${category.name} with ${describeBudget(category.monthlyBudgetCents)}.`,
    })
    form.focus('name')
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <CategoryFields form={form} onChange={handleChange} />
      <div className={styles.actions}>
        <Button variant="primary" type="submit">
          Add category
        </Button>
        <p className={styles.status} role="status">
          {outcome.kind === 'added' && outcome.message}
        </p>
      </div>
      {outcome.kind === 'rejected' && (
        <p className={styles.formError} role="alert">
          This category couldn&apos;t be added. Check the details and try again.
        </p>
      )}
    </form>
  )
}
