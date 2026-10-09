import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CURRENT_VERSION } from '@/shared/storage/migrations'
import {
  BACKUP_KEY,
  STORAGE_KEY,
  type StorageLike,
} from '@/shared/storage/storage'
import { useAppData } from './AppDataContext'
import { AppDataProvider } from './AppDataProvider'
import { DEFAULT_CATEGORY_NAMES } from './defaultData'
import { createTestIds, createTestStorage } from './testStorage'

/** Minimal consumer that shows the store and triggers changes. */
function Probe() {
  const { data, notice, addTransaction, deleteCategory } = useAppData()
  const firstCategory = data.categories[0]

  return (
    <>
      <ul aria-label="Categories">
        {data.categories.map((category) => (
          <li key={category.id}>{category.name}</li>
        ))}
      </ul>
      <p>Transactions: {data.transactions.length}</p>
      <p>Notice: {notice ?? 'none'}</p>
      <button
        onClick={() => {
          if (firstCategory) {
            addTransaction({
              amountCents: 1250,
              date: '2026-10-08',
              categoryId: firstCategory.id,
            })
          }
        }}
      >
        Add transaction
      </button>
      <button
        onClick={() => {
          if (firstCategory) deleteCategory(firstCategory.id)
        }}
      >
        Delete first category
      </button>
    </>
  )
}

function renderStore(storage: StorageLike) {
  return render(
    <AppDataProvider storage={storage} createId={createTestIds()}>
      <Probe />
    </AppDataProvider>,
  )
}

function categoryNames() {
  return screen.getAllByRole('listitem').map((item) => item.textContent)
}

async function addTransaction() {
  await userEvent.click(screen.getByRole('button', { name: 'Add transaction' }))
}

describe('AppDataProvider', () => {
  it('seeds the default categories on first load without writing storage', () => {
    const { storage, writes } = createTestStorage()

    renderStore(storage)

    expect(categoryNames()).toEqual([...DEFAULT_CATEGORY_NAMES])
    expect(screen.getByText('Notice: none')).toBeInTheDocument()
    expect(writes).toEqual([])
  })

  it('saves each change so it survives a reload', async () => {
    const { storage } = createTestStorage()
    const { unmount } = renderStore(storage)

    await addTransaction()
    expect(screen.getByText('Transactions: 1')).toBeInTheDocument()
    unmount()

    renderStore(storage)
    expect(screen.getByText('Transactions: 1')).toBeInTheDocument()
    expect(categoryNames()).toEqual([...DEFAULT_CATEGORY_NAMES])
  })

  it('applies two changes in one event without losing the first', async () => {
    const { storage, items } = createTestStorage()
    function DoubleAdd() {
      const { data, addTransaction } = useAppData()
      const categoryId = data.categories[0]?.id ?? ''
      const draft = { amountCents: 100, date: '2026-10-08', categoryId }
      return (
        <button
          onClick={() => {
            addTransaction(draft)
            addTransaction(draft)
          }}
        >
          Add two
        </button>
      )
    }
    render(
      <AppDataProvider storage={storage} createId={createTestIds()}>
        <DoubleAdd />
      </AppDataProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Add two' }))

    expect(JSON.parse(items.get(STORAGE_KEY) ?? 'null')).toMatchObject({
      data: { transactions: [{}, {}] },
    })
  })

  it('reports whether a transaction was added', async () => {
    const { storage } = createTestStorage()
    function AddResults() {
      const { data, addTransaction } = useAppData()
      const [results, setResults] = useState<boolean[]>([])
      const categoryId = data.categories[0]?.id ?? ''
      return (
        <>
          <p>Results: {results.join(', ')}</p>
          <button
            onClick={() => {
              const date = '2026-10-08'
              setResults([
                addTransaction({ amountCents: 100, date, categoryId }),
                addTransaction({ amountCents: 0, date, categoryId }),
              ])
            }}
          >
            Add
          </button>
        </>
      )
    }
    render(
      <AppDataProvider storage={storage} createId={createTestIds()}>
        <AddResults />
      </AppDataProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Results: true, false')).toBeInTheDocument()
  })

  it('reports whether a transaction was updated', async () => {
    const { storage } = createTestStorage()
    function UpdateResults() {
      const { data, addTransaction, updateTransaction } = useAppData()
      const [results, setResults] = useState<boolean[]>([])
      const categoryId = data.categories[0]?.id ?? ''
      const existing = data.transactions[0]
      return (
        <>
          <p>Results: {results.join(', ')}</p>
          <button
            onClick={() => {
              addTransaction({
                amountCents: 100,
                date: '2026-10-08',
                categoryId,
              })
            }}
          >
            Add
          </button>
          <button
            onClick={() => {
              if (!existing) return
              setResults([
                updateTransaction({ ...existing, amountCents: 250 }),
                updateTransaction({ ...existing, amountCents: 0 }),
                updateTransaction({ ...existing, id: 'unknown' }),
              ])
            }}
          >
            Update
          </button>
        </>
      )
    }
    render(
      <AppDataProvider storage={storage} createId={createTestIds()}>
        <UpdateResults />
      </AppDataProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    await userEvent.click(screen.getByRole('button', { name: 'Update' }))

    expect(screen.getByText('Results: true, false, false')).toBeInTheDocument()
  })

  it('reports whether a transaction was deleted', async () => {
    const { storage } = createTestStorage()
    function DeleteResults() {
      const { data, addTransaction, deleteTransaction } = useAppData()
      const [results, setResults] = useState<boolean[]>([])
      const categoryId = data.categories[0]?.id ?? ''
      const existing = data.transactions[0]
      return (
        <>
          <p>Results: {results.join(', ')}</p>
          <button
            onClick={() => {
              addTransaction({
                amountCents: 100,
                date: '2026-10-08',
                categoryId,
              })
            }}
          >
            Add
          </button>
          <button
            onClick={() => {
              if (!existing) return
              setResults([
                deleteTransaction(existing.id),
                deleteTransaction(existing.id),
              ])
            }}
          >
            Delete twice
          </button>
        </>
      )
    }
    render(
      <AppDataProvider storage={storage} createId={createTestIds()}>
        <DeleteResults />
      </AppDataProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete twice' }))

    expect(screen.getByText('Results: true, false')).toBeInTheDocument()
  })

  it('reports whether a category was added or updated', async () => {
    const { storage } = createTestStorage()
    function CategoryResults() {
      const { data, addCategory, updateCategory } = useAppData()
      const [results, setResults] = useState<boolean[]>([])
      const first = data.categories[0]
      return (
        <>
          <p>Results: {results.join(', ')}</p>
          <button
            onClick={() => {
              if (!first) return
              setResults([
                addCategory({ name: 'Fuel', monthlyBudgetCents: 5000 }),
                addCategory({ name: 'fuel', monthlyBudgetCents: 0 }),
                updateCategory({ ...first, monthlyBudgetCents: 40000 }),
                updateCategory({ ...first, id: 'unknown' }),
              ])
            }}
          >
            Change
          </button>
        </>
      )
    }
    render(
      <AppDataProvider storage={storage} createId={createTestIds()}>
        <CategoryResults />
      </AppDataProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Change' }))

    expect(
      screen.getByText('Results: true, false, true, false'),
    ).toBeInTheDocument()
  })

  it('reports whether a category was deleted', async () => {
    const { storage } = createTestStorage()
    function DeleteResults() {
      const { data, addTransaction, deleteCategory } = useAppData()
      const [results, setResults] = useState<boolean[]>([])
      const [used, unused] = data.categories
      return (
        <>
          <p>Results: {results.join(', ')}</p>
          <button
            onClick={() => {
              if (!used || !unused) return
              addTransaction({
                amountCents: 100,
                date: '2026-10-08',
                categoryId: used.id,
              })
            }}
          >
            Use first
          </button>
          <button
            onClick={() => {
              if (!used || !unused) return
              setResults([
                deleteCategory(used.id),
                deleteCategory(unused.id),
                deleteCategory('unknown'),
              ])
            }}
          >
            Delete
          </button>
        </>
      )
    }
    render(
      <AppDataProvider storage={storage} createId={createTestIds()}>
        <DeleteResults />
      </AppDataProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Use first' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.getByText('Results: false, true, false')).toBeInTheDocument()
  })

  it('ignores deleting a category that still has transactions', async () => {
    const { storage } = createTestStorage()
    renderStore(storage)
    await addTransaction()

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete first category' }),
    )

    expect(categoryNames()).toEqual([...DEFAULT_CATEGORY_NAMES])
  })

  describe('when stored data is corrupt', () => {
    it('starts from the defaults, shows a notice and leaves storage untouched', () => {
      const { storage, items, writes } = createTestStorage({
        [STORAGE_KEY]: '{not json',
      })

      renderStore(storage)

      expect(categoryNames()).toEqual([...DEFAULT_CATEGORY_NAMES])
      expect(screen.getByText('Notice: corruptBackedUp')).toBeInTheDocument()
      expect(writes).toEqual([])
      expect(items.get(STORAGE_KEY)).toBe('{not json')
    })

    it('backs up the old data before the first save replaces it', async () => {
      const { storage, items } = createTestStorage({
        [STORAGE_KEY]: '{not json',
      })
      renderStore(storage)

      await addTransaction()

      expect(items.get(BACKUP_KEY)).toBe('{not json')
      expect(JSON.parse(items.get(STORAGE_KEY) ?? 'null')).toMatchObject({
        data: { transactions: [{ amountCents: 1250 }] },
      })
    })

    it('treats data from a newer app version the same way', async () => {
      const newer = JSON.stringify({
        version: CURRENT_VERSION + 1,
        data: { categories: [], transactions: [], budgets: [] },
      })
      const { storage, items } = createTestStorage({ [STORAGE_KEY]: newer })
      renderStore(storage)
      expect(screen.getByText('Notice: corruptBackedUp')).toBeInTheDocument()

      await addTransaction()

      expect(items.get(BACKUP_KEY)).toBe(newer)
    })

    it('keeps the old data and stops saving if the backup fails', async () => {
      const { storage, items } = createTestStorage(
        { [STORAGE_KEY]: '{not json' },
        { failingKeys: [BACKUP_KEY] },
      )
      renderStore(storage)

      await addTransaction()

      expect(screen.getByText('Transactions: 1')).toBeInTheDocument()
      expect(screen.getByText('Notice: corruptNotBackedUp')).toBeInTheDocument()
      expect(items.get(STORAGE_KEY)).toBe('{not json')
    })
  })

  it('keeps working in memory and shows a notice when storage is unavailable', async () => {
    const { storage } = createTestStorage({}, { blocked: true })
    renderStore(storage)

    expect(screen.getByText('Notice: unavailable')).toBeInTheDocument()
    await addTransaction()

    expect(screen.getByText('Transactions: 1')).toBeInTheDocument()
  })

  it('shows a notice when a save fails', async () => {
    const { storage } = createTestStorage({}, { failingKeys: [STORAGE_KEY] })
    renderStore(storage)

    await addTransaction()

    expect(screen.getByText('Transactions: 1')).toBeInTheDocument()
    expect(screen.getByText('Notice: saveFailed')).toBeInTheDocument()
  })
})

describe('useAppData', () => {
  it('throws a clear error outside the provider', () => {
    function Orphan() {
      useAppData()
      return null
    }
    // React logs the thrown error; keep the test output clean.
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    expect(() => render(<Orphan />)).toThrow(
      'useAppData must be used inside <AppDataProvider>',
    )
    consoleError.mockRestore()
  })
})
