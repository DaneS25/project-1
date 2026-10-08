// Domain primitives and entities shared across features and storage.

/** Money in integer cents (always a safe, non-negative integer). */
export type Cents = number

/** Calendar date as `YYYY-MM-DD`. */
export type IsoDate = string

/** Calendar month as `YYYY-MM`. */
export type MonthKey = string

export type Id = string

/** An expense. `amountCents` is a positive integer. */
export type Transaction = {
  id: Id
  amountCents: Cents
  date: IsoDate
  categoryId: Id
  note?: string
}

/** A spending category. `name` is unique across categories. */
export type Category = {
  id: Id
  name: string
  monthlyBudgetCents: Cents
}

/** Everything the app persists. */
export type AppData = {
  transactions: Transaction[]
  categories: Category[]
}

/** Outcome of an operation that can fail in an expected way. */
export type Result<T, E = string> =
  { ok: true; value: T } | { ok: false; error: E }
