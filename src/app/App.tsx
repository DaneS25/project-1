import { useState } from 'react'
import { AppShell } from '@/app/AppShell'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { StorageNotice } from '@/app/StorageNotice'
import { TransactionForm, TransactionList } from '@/features/transactions'
import { EmptyState } from '@/shared/components/EmptyState'
import { Panel } from '@/shared/components/Panel'
import { toIsoDate } from '@/shared/lib/dates'
import { AppDataProvider } from '@/shared/store/AppDataProvider'
import type { IsoDate } from '@/shared/types'
import styles from './App.module.css'

type AppProps = {
  /** Fixes "today" for tests; defaults to the local date at startup. */
  today?: IsoDate
}

export function App({ today: fixedToday }: AppProps) {
  // Read once on first render so the date doesn't change between renders.
  const [today] = useState(() => fixedToday ?? toIsoDate(new Date()))

  return (
    <ErrorBoundary>
      <AppDataProvider>
        <AppShell>
          <StorageNotice />
          <div className={styles.grid}>
            <Panel title="Add a transaction" description="Record an expense">
              <TransactionForm today={today} />
            </Panel>
            <Panel
              title="This month"
              description="Spending against each category's budget"
            >
              <EmptyState
                title="No spending yet"
                description="Add a transaction to see how you're tracking against your budgets."
              />
            </Panel>
            <Panel title="Transactions" description="Newest first">
              <TransactionList />
            </Panel>
          </div>
        </AppShell>
      </AppDataProvider>
    </ErrorBoundary>
  )
}
