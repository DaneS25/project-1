import { useId } from 'react'
import { FormField } from '@/shared/components/FormField'
import styles from '@/shared/components/Form.module.css'
import type { FormDraft } from '@/shared/hooks/useFormDraft'
import type { CategoryDraft } from '../logic/categoryDraft'

type CategoryFieldsProps = {
  form: FormDraft<CategoryDraft>
  onChange: (field: keyof CategoryDraft, value: string) => void
}

/** The name and monthly budget fields shared by add and edit. */
export function CategoryFields({ form, onChange }: CategoryFieldsProps) {
  const id = useId()
  const { draft, errors, register } = form
  const budgetHintId = `${id}-budget-hint`

  function errorId(field: keyof CategoryDraft) {
    return `${id}-${field}-error`
  }

  return (
    <div className={styles.fields}>
      <FormField
        label="Name"
        controlId={`${id}-name`}
        errorId={errorId('name')}
        error={errors.name}
      >
        <input
          ref={register('name')}
          id={`${id}-name`}
          className={styles.control}
          type="text"
          autoComplete="off"
          value={draft.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? errorId('name') : undefined}
          onChange={(e) => {
            onChange('name', e.target.value)
          }}
        />
      </FormField>
      <FormField
        label="Monthly budget"
        controlId={`${id}-budget`}
        errorId={errorId('budget')}
        error={errors.budget}
        hint={{ id: budgetHintId, text: 'Leave blank for no budget.' }}
      >
        <div className={styles.amount}>
          <span className={styles.currency} aria-hidden="true">
            $
          </span>
          <input
            ref={register('budget')}
            id={`${id}-budget`}
            className={styles.control}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={draft.budget}
            aria-invalid={errors.budget ? true : undefined}
            aria-describedby={
              errors.budget
                ? `${budgetHintId} ${errorId('budget')}`
                : budgetHintId
            }
            onChange={(e) => {
              onChange('budget', e.target.value)
            }}
          />
        </div>
      </FormField>
    </div>
  )
}
