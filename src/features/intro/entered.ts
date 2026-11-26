/**
 * The moment the visitor passes the entry loader: pressing ENTER, or at once when there is no loader to pass (a
 * no-JS-then-JS edge, a missing element). The hero waits on it to start its own entrance, so nothing plays unseen
 * behind the curtain.
 */
let open: () => void = () => undefined

export const entered = new Promise<void>((resolve) => {
  open = resolve
})

export function markEntered() {
  open()
}
