import { AppShell } from '@/app/AppShell'
import { EmptyState } from '@/shared/components/EmptyState'
import { Panel } from '@/shared/components/Panel'
import styles from './App.module.css'

export function App() {
  return (
    <AppShell>
      <div className={styles.grid}>
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
          <EmptyState
            title="No transactions yet"
            description="Transactions you add will appear here."
          />
        </Panel>
      </div>
    </AppShell>
  )
}
