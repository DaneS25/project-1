/** Where a click happened: `detail` is 0 when a key (Enter or Space) clicked. */
export type ClickPoint = { detail: number; clientX: number; clientY: number }

/** The clicked element's box, as from `getBoundingClientRect()`. */
export type Box = { left: number; top: number; width: number; height: number }

/**
 * The point, in pixels from the element's top-left corner, that the sun
 * flare should burst from: where the pointer clicked, or the centre for a
 * keyboard click. A pointer point outside the box is clamped to its edge.
 */
export function flareOrigin(
  click: ClickPoint,
  box: Box,
): { x: number; y: number } {
  if (click.detail === 0) return { x: box.width / 2, y: box.height / 2 }
  return {
    x: clamp(click.clientX - box.left, 0, box.width),
    y: clamp(click.clientY - box.top, 0, box.height),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
