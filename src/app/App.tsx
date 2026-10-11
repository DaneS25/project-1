import { useState } from 'react'
import { AppShell } from '@/app/AppShell'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { StorageNotice } from '@/app/StorageNotice'
import { CategoryForm, CategoryList } from '@/features/categories'
import { InsightsPanel } from '@/features/insights'
import { MonthlySummary } from '@/features/summary'
import { TransactionForm, TransactionList } from '@/features/transactions'
import { Panel } from '@/shared/components/Panel'
import { CuteIcon } from '@/shared/components/icons/CuteIcon'
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
            <Panel
              title="Add a transaction"
              description="Record an expense"
              pinkIcon={<CuteIcon name="heart" isFilled />}
            >
              <TransactionForm today={today} />
            </Panel>
            <Panel
              title="Monthly summary"
              pinkIcon={<CuteIcon name="piggyBank" isFilled />}
              description="Spending against each category's budget"
            >
              <MonthlySummary today={today} />
            </Panel>
            <Panel
              title="Transactions"
              description="Newest first"
              pinkIcon="💌"
            >
              <TransactionList />
            </Panel>
            <Panel
              title="Categories"
              pinkIcon="🎀"
              description="Monthly budgets, sorted by name"
            >
              <CategoryForm />
              <CategoryList />
            </Panel>
            <Panel
              title="Insights"
              pinkIcon={<CuteIcon name="sparkle" isFilled />}
              description="Charts of where your money goes"
            >
              <InsightsPanel today={today} />
            </Panel>
          </div>
        </AppShell>
      </AppDataProvider>
    </ErrorBoundary>
  )
}
