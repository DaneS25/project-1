import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { useAppData } from '@/shared/store/AppDataContext'
import type { Category } from '@/shared/types'

type DeleteCategoryDialogProps = {
  category: Category
  onDelete: (category: Category) => void
  onCancel: () => void
}

/**
 * Asks before deleting a category. Only opened for a category with no
 * transactions; the store refuses otherwise, and the dialog says so.
 */
export function DeleteCategoryDialog({
  category,
  onDelete,
  onCancel,
}: DeleteCategoryDialogProps) {
  const { deleteCategory } = useAppData()

  return (
    <ConfirmDialog
      title="Delete this category?"
      message={`${category.name} will be deleted. This can't be undone.`}
      confirmLabel="Delete"
      failureMessage="This category couldn't be deleted. It may have transactions, or it may already have been removed."
      onConfirm={() => deleteCategory(category.id)}
      onConfirmed={() => {
        onDelete(category)
      }}
      onCancel={onCancel}
    />
  )
}
