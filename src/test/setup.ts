import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// jsdom doesn't implement <dialog> methods. This stand-in opens and closes
// the dialog, focuses its first field, and turns Escape into a cancelable
// `cancel` event, like a browser. It doesn't trap focus or make the rest of
// the page inert.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  const withEscape = new WeakSet<HTMLDialogElement>()
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true
    if (!withEscape.has(this)) {
      withEscape.add(this)
      this.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !this.open) return
        if (this.dispatchEvent(new Event('cancel', { cancelable: true }))) {
          this.close()
        }
      })
    }
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
