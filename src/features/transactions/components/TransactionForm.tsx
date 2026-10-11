import { useState, type SubmitEvent } from 'react'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { formatCents } from '@/shared/lib/money'
import { useAppData } from '@/shared/store/AppDataContext'
import type { IsoDate } from '@/shared/types'
import { useFormDraft } from '@/shared/hooks/useFormDraft'
import {
  validateTransactionDraft,
  type TransactionDraft,
} from '../logic/transactionDraft'
import { useFlourish } from '../hooks/useFlourish'
import { SuccessLabel } from './SuccessLabel'
import { TransactionFields } from './TransactionFields'
import styles from '@/shared/components/Form.module.css'

type TransactionFormProps = {
  /** The date the form starts with. Passed in so tests are deterministic. */
  today: IsoDate
}

type Outcome =
  { kind: 'idle' } | { kind: 'added'; message: string } | { kind: 'rejected' }

/**
 * Form for adding an expense. Draft values stay local until a valid submit;
 * after an add, the amount and note are cleared but the date and category
 * are kept, since several expenses are often entered for the same day.
 * A successful add also briefly shows a check on the Add button.
 */
export function TransactionForm({ today }: TransactionFormProps) {
  const { data, addTransaction } = useAppData()
  const form = useFormDraft<TransactionDraft>({
    amount: '',
    date: today,
    categoryId: '',
    note: '',
  })
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' })
  const flourish = useFlourish()

  if (data.categories.length === 0) {
    return (
      <EmptyState
        title="No categories yet"
        description="Add a category before adding transactions."
        pinkEmoji="🌱"
      />
    )
  }

  function handleChange(field: keyof TransactionDraft, value: string) {
    form.change(field, value)
    // Clear the last result once the next entry starts. This also means a
    // repeat of the same add changes the status from empty to the message,
    // so screen readers announce it again.
    if (outcome.kind !== 'idle') setOutcome({ kind: 'idle' })
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const transaction = form.check((draft) =>
      validateTransactionDraft(draft, data.categories),
    )
    if (!transaction) {
      setOutcome({ kind: 'idle' })
      return
    }
    if (!addTransaction(transaction)) {
      setOutcome({ kind: 'rejected' })
      return
    }
    const category = data.categories.find(
      (c) => c.id === transaction.categoryId,
    )
    form.setDraft({ ...form.draft, amount: '', note: '' })
    setOutcome({
      kind: 'added',
      message: `Added ${formatCents(transaction.amountCents)} to ${category?.name ?? 'the category'}.`,
    })
    flourish.start()
    form.focus('amount')
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <TransactionFields
        form={form}
        categories={data.categories}
        onChange={handleChange}
      />
      <div className={styles.actions}>
        <Button variant="primary" type="submit">
          <SuccessLabel label="Add transaction" isDone={flourish.isShowing} />
        </Button>
        <p className={styles.status} role="status">
          {outcome.kind === 'added' && outcome.message}
        </p>
      </div>
      {outcome.kind === 'rejected' && (
        <p className={styles.formError} role="alert">
          This transaction couldn&apos;t be added. Check the details and try
          again.
        </p>
      )}
    </form>
  )
}
