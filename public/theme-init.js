// Runs before first paint. `js` arms the scroll reveals (a no-JS visit shows everything); the theme class uses the
// same storage key and rules as src/components/theme-provider.tsx
document.documentElement.classList.add("js")
// Raises the entry loader (src/features/intro); a no-JS visit never sees it
document.documentElement.dataset.intro = ""
try {
  const stored = localStorage.getItem("theme")
  const dark =
    stored === "dark" ||
    (stored !== "light" && matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.add(dark ? "dark" : "light")
} catch {
  // Storage can be blocked (private mode); the provider applies the theme after mount
}
