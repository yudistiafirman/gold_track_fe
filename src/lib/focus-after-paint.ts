/**
 * Runs `focus` after the browser has actually painted the next frame.
 * A bare `setTimeout(fn, 0)` can still fire before React has committed a
 * pending state change (e.g. an input's `disabled` flipping back to false
 * right after a mutation resolves) — `.focus()` on a still-disabled element
 * is a silent no-op. Double rAF reliably waits past the real paint.
 */
export function focusAfterPaint(focus: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      focus()
    })
  })
}
