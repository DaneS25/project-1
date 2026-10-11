import { useSyncExternalStore } from 'react'
import type { Palette } from '@/shared/storage/palette'

/**
 * The palette in use, read from `data-palette` on <html> (set by the palette
 * toggle and by index.html before first paint). Prefer CSS on
 * `[data-palette='pink']`; use this only when a component must render
 * something different, such as a pink-only decoration.
 */
export function usePalette(): Palette {
  return useSyncExternalStore(subscribe, readPalette, () => 'sunset')
}

function readPalette(): Palette {
  return document.documentElement.dataset.palette === 'pink' ? 'pink' : 'sunset'
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-palette'],
  })
  return () => {
    observer.disconnect()
  }
}
