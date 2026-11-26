// Same storage key and rules as src/components/theme-provider.tsx
try {
  const stored = localStorage.getItem("theme")
  const dark =
    stored === "dark" ||
    (stored !== "light" && matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.add(dark ? "dark" : "light")
} catch {
  // Storage can be blocked (private mode); the provider applies the theme after mount
}
