import { useId, useState, type SubmitEvent } from 'react'
import { Button } from '@/shared/components/Button'
import dialogStyles from '@/shared/components/Dialog.module.css'
import formStyles from '@/shared/components/Form.module.css'
import { useFormDraft } from '@/shared/hooks/useFormDraft'
import { useModalDialog } from '@/shared/hooks/useModalDialog'
import { centsToAmountInput } from '@/shared/lib/money'
import { useAppData } from '@/shared/store/AppDataContext'
import type { Category } from '@/shared/types'
import {
  validateCategoryDraft,
  type CategoryDraft,
} from '../logic/categoryDraft'
import { CategoryFields } from './CategoryFields'

type EditCategoryDialogProps = {
  category: Category
  onSave: (category: Category) => void
  onCancel: () => void
}

/**
 * A modal form for renaming a category or changing its budget. A budget
 * of zero shows as a blank field, matching "leave blank for no budget".
 */
export function EditCategoryDialog({
  category,
  onSave,
  onCancel,
}: EditCategoryDialogProps) {
  const { data, updateCategory } = useAppData()
  const form = useFormDraft<CategoryDraft>({
    name: category.name,
    budget:
      category.monthlyBudgetCents === 0
        ? ''
        : centsToAmountInput(category.monthlyBudgetCents),
  })
  const [isRejected, setIsRejected] = useState(false)
  const { dialogRef, closeThen } = useModalDialog()
  const headingId = useId()

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsRejected(false)
    const changes = form.check((draft) =>
      validateCategoryDraft(draft, data.categories, category.id),
    )
    if (!changes) return
    const updated = { id: category.id, ...changes }
    if (!updateCategory(updated)) {
      setIsRejected(true)
      return
    }
    closeThen(() => {
      onSave(updated)
    })
  }

  return (
    <dialog
      ref={dialogRef}
      className={dialogStyles.dialog}
      aria-labelledby={headingId}
      onCancel={(event) => {
        // Escape: close through the same path as the Cancel button.
        event.preventDefault()
        closeThen(onCancel)
      }}
    >
      <form className={formStyles.form} noValidate onSubmit={handleSubmit}>
        <h2 id={headingId} className={dialogStyles.title}>
          Edit category
        </h2>
        <CategoryFields form={form} onChange={form.change} />
        {isRejected && (
          <p className={formStyles.formError} role="alert">
            These changes couldn&apos;t be saved. Check the details and try
            again.
          </p>
        )}
        <div className={formStyles.actions}>
          <Button variant="primary" type="submit">
            Save changes
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              closeThen(onCancel)
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </dialog>
  )
}
