import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CURRENT_VERSION } from '@/shared/storage/migrations'
import { STORAGE_KEY } from '@/shared/storage/storage'
import { AppDataProvider } from '@/shared/store/AppDataProvider'
import { createTestIds, createTestStorage } from '@/shared/store/testStorage'
import type { Transaction } from '@/shared/types'
import { InsightsPanel } from './InsightsPanel'

const categories = [{ id: 'rent', name: 'Rent', monthlyBudgetCents: 0 }]

function renderPanel(transactions: Transaction[]) {
  const { storage } = createTestStorage({
    [STORAGE_KEY]: JSON.stringify({
      version: CURRENT_VERSION,
      data: { transactions, categories },
    }),
  })
  render(
    <AppDataProvider storage={storage} createId={createTestIds()}>
      <InsightsPanel today="2026-10-09" />
    </AppDataProvider>,
  )
}

const rentInSeptember: Transaction = {
  id: 't1',
  amountCents: 100,
  date: '2026-09-15',
  categoryId: 'rent',
}

describe('InsightsPanel', () => {
  it("opens on today's month with an empty state when it has no spending", () => {
    renderPanel([rentInSeptember])

    expect(screen.getByText('October 2026')).toBeInTheDocument()
    expect(screen.getByText('No spending in October 2026')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Charts' })).toBeNull()
  })

  it('shows the charts for a month with spending', async () => {
    renderPanel([rentInSeptember])

    await userEvent.click(
      screen.getByRole('button', { name: 'Previous month, September 2026' }),
    )

    expect(screen.getByRole('region', { name: 'Charts' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Where the money went' }),
    ).toBeInTheDocument()
  })

  it('shows a plain message when the totals are too large to chart', () => {
    const max = Number.MAX_SAFE_INTEGER
    renderPanel([
      { ...rentInSeptember, id: 'a', amountCents: max, date: '2026-10-01' },
      { ...rentInSeptember, id: 'b', amountCents: max, date: '2026-10-02' },
    ])

    expect(
      screen.getByText(/totals for October 2026 are too large to chart/),
    ).toBeInTheDocument()
  })
})
