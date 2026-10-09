import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

function renderDialog(onConfirm: () => boolean) {
  const onConfirmed = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDialog
      title="Delete this thing?"
      message="The thing will be deleted."
      confirmLabel="Delete"
      failureMessage="The thing couldn't be deleted."
      onConfirm={onConfirm}
      onConfirmed={onConfirmed}
      onCancel={onCancel}
    />,
  )
  return { onConfirmed, onCancel }
}

const deleteButton = () => screen.getByRole('button', { name: 'Delete' })

describe('ConfirmDialog', () => {
  it('is an alert dialog named by its title and described by its message', () => {
    renderDialog(() => true)

    expect(
      screen.getByRole('alertdialog', { name: 'Delete this thing?' }),
    ).toHaveAccessibleDescription('The thing will be deleted.')
  })

  it('reports success after acting', async () => {
    const { onConfirmed, onCancel } = renderDialog(() => true)

    await userEvent.click(deleteButton())

    expect(onConfirmed).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('stays open with the failure message when the action fails', async () => {
    const { onConfirmed } = renderDialog(() => false)

    await userEvent.click(deleteButton())

    expect(screen.getByRole('alert')).toHaveTextContent(
      "The thing couldn't be deleted.",
    )
    expect(onConfirmed).not.toHaveBeenCalled()
  })

  it('cancels without acting', async () => {
    const onConfirm = vi.fn(() => true)
    const { onCancel } = renderDialog(onConfirm)

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
