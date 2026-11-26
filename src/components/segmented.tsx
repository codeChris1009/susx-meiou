import type { ComponentType, SVGProps } from "react"
import { useLayoutEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: ComponentType<SVGProps<SVGSVGElement>>
}

interface SegmentedProps<T extends string> {
  /** Names the group for assistive tech, e.g. "View" */
  label: string
  value: T
  options: readonly SegmentOption<T>[]
  onChange: (value: T) => void
  /** Icons only below the sm breakpoint (labels stay for screen readers) */
  iconsOnlyOnSmall?: boolean
  className?: string
}

/** Moves the plate under the pressed choice; hides it when nothing is pressed */
function placeThumb(group: HTMLElement) {
  const pressed = group.querySelector<HTMLElement>("[aria-pressed='true']")
  if (!pressed) return group.removeAttribute("data-placed")
  group.style.setProperty("--thumb-x", `${pressed.offsetLeft}px`)
  group.style.setProperty("--thumb-w", `${pressed.offsetWidth}px`)
  group.setAttribute("data-placed", "")
}

/**
 * A row of mutually exclusive choices with a plate that slides to the chosen one. The plate's place and width are
 * measured from the pressed button and written as custom properties through the CSSOM (no style attributes under the
 * CSP); CSS animates it. Each choice is a toggle button (aria-pressed), so it reads as what it is.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  iconsOnlyOnSmall = false,
  className,
}: SegmentedProps<T>) {
  const group = useRef<HTMLDivElement>(null)

  // A new choice, or a different set of choices: move the plate before paint
  useLayoutEffect(() => {
    if (group.current) placeThumb(group.current)
  }, [value, options])

  // Labels change width as the font arrives or the layout wraps: one observer for the life of the control
  useLayoutEffect(() => {
    const el = group.current
    if (!el) return
    const ro = new ResizeObserver(() => placeThumb(el))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={group}
      role="group"
      aria-label={label}
      className={cn("segmented", className)}
    >
      <span aria-hidden className="segmented-thumb" />
      {options.map(({ value: option, label: text, icon: Icon }) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          className="segmented-item pressable group/segment"
        >
          {Icon && (
            <Icon
              aria-hidden
              className="size-3.5 transition-transform duration-500 ease-(--ease-spring) group-hover/segment:scale-110 group-hover/segment:-rotate-6"
            />
          )}
          <span
            className={cn(iconsOnlyOnSmall && Icon && "sr-only sm:not-sr-only")}
          >
            {text}
          </span>
        </button>
      ))}
    </div>
  )
}
