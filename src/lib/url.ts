/**
 * True only for absolute http(s) URLs. Every link the page renders from synced data passes through this: a homepage
 * field on GitHub is free text, and a javascript: or data: URL must never become an href, whatever the CSP would do.
 */
export function isWebUrl(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    const { protocol } = new URL(value)
    return protocol === "https:" || protocol === "http:"
  } catch {
    return false
  }
}
