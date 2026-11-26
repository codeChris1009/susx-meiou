import { useEffect, type RefObject } from "react"

/** Typing into a field, or into anything editable, keeps "/" as a character */
const isTyping = (el: Element | null) =>
  el instanceof HTMLInputElement ||
  el instanceof HTMLTextAreaElement ||
  el instanceof HTMLSelectElement ||
  (el instanceof HTMLElement && el.isContentEditable)

/**
 * "/" jumps to a filter field, the convention of code hosts and docs sites. With several filters on the page, the one
 * whose `scope` holds the middle of the viewport answers; when none does (the reader is in the hero, say), the first
 * scope on the page answers and is scrolled to.
 *
 * @param scopeSelector  selector every competing scope shares, so each instance can tell whether it is the first
 */
export function useSlashFocus(
  input: RefObject<HTMLInputElement | null>,
  scope: RefObject<HTMLElement | null>,
  scopeSelector: string
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping(document.activeElement)) return
      const field = input.current
      const own = scope.current
      if (!field || !own) return
      const middle = window.innerHeight / 2
      const holds = (el: Element) => {
        const box = el.getBoundingClientRect()
        return box.top <= middle && box.bottom >= middle
      }
      const scopes = [...document.querySelectorAll(scopeSelector)]
      const answering = scopes.find(holds) ?? scopes[0]
      if (answering !== own) return
      e.preventDefault()
      if (!holds(own)) own.scrollIntoView({ block: "start" })
      field.focus({ preventScroll: true })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [input, scope, scopeSelector])
}
