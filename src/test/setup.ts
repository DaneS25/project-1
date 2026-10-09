import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// jsdom doesn't implement <dialog> methods. This stand-in opens and closes
// the dialog and focuses its first field, like a browser; it doesn't trap
// focus or make the rest of the page inert.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true
    this.querySelector<HTMLElement>(
      '[autofocus], input, select, textarea, button',
    )?.focus()
  }
  HTMLDialogElement.prototype.close = function close() {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})
