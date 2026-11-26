import { cva, type VariantProps } from "class-variance-authority"

/**
 * The page's buttons, and links dressed as buttons: uppercase Geist, the 0.35rem corner, and one shared feel. Hover
 * rolls the label (its twin rises from below) and floods the plate from the bottom; a press sinks it (.pressable).
 */
export const actionVariants = cva(
  [
    "pressable group/action relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-lg",
    "text-[0.7rem] font-medium tracking-[0.22em] whitespace-nowrap uppercase select-none",
    // The flood: a plate of colour rising behind the label
    "before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:transition-transform before:duration-500 before:ease-(--ease-out-expo) hover:before:scale-y-100 focus-visible:before:scale-y-100",
    "disabled:pointer-events-none disabled:opacity-40",
  ],
  {
    variants: {
      tone: {
        /** The one action that matters most on a screen */
        solid:
          "h-11 bg-foreground px-6 text-background before:bg-metal hover:shadow-[0_14px_32px_-14px_color-mix(in_oklch,var(--metal-hi)_55%,transparent)]",
        /** Everything else that deserves a plate */
        outline:
          "h-11 px-6 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_16%,transparent)] before:bg-accent hover:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--metal-mid)_60%,transparent)]",
        /** Square, icon only */
        icon: "size-11 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_16%,transparent)] before:bg-accent hover:shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--metal-mid)_60%,transparent)]",
        /** Text only, for rows of small controls (nav, footer) */
        quiet:
          "h-9 px-2.5 text-muted-foreground before:bg-accent hover:text-foreground",
      },
    },
    defaultVariants: { tone: "outline" },
  }
)

export type ActionTone = NonNullable<
  VariantProps<typeof actionVariants>["tone"]
>

/**
 * The rolling label: the word, and its twin waiting below (see .roll in index.css). The twin is a hidden element, not
 * CSS content, so the accessible name stays the word once.
 */
export function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span className="roll-in">
        {children}
        <span aria-hidden className="roll-twin">
          {children}
        </span>
      </span>
    </span>
  )
}
