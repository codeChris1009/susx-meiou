import { useReveal } from "@/hooks/use-reveal"
import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  id: string
  /** Place in the page outline, "01" */
  index: string
  /** English, the large line. No punctuation */
  title: string
  /** Chinese, the small line beneath. No punctuation */
  subtitle: string
  /** A short English note on the right, e.g. "07 PROJECTS" */
  note: string
  className?: string
}

/**
 * A section opens like a chapter of a printed catalogue: the index in brackets, the English title set large and tight,
 * the Chinese subtitle small beneath it, a note at the far edge, and an engraved rule that draws itself in.
 */
export function SectionHeading({
  id,
  index,
  title,
  subtitle,
  note,
  className,
}: SectionHeadingProps) {
  const reveal = useReveal<HTMLDivElement>()
  const rule = useReveal<HTMLDivElement>()
  return (
    <div className={cn("mb-12", className)}>
      <div
        ref={reveal}
        className="reveal grid grid-cols-[auto_1fr] items-end gap-x-5 gap-y-3 pb-6 sm:grid-cols-[auto_1fr_auto]"
      >
        <span
          aria-hidden
          className="self-start text-metal pt-[0.6em] text-xs font-medium tracking-[0.2em] tabular-nums"
        >
          ({index})
        </span>
        <h2
          id={id}
          className="group/heading cursor-default transition-transform duration-500 ease-(--ease-spring) select-none active:scale-[0.985]"
        >
          <span
            lang="en"
            className="heading-display block text-[clamp(3rem,8.5vw,7.5rem)] transition-[letter-spacing] duration-700 ease-(--ease-out-expo) group-hover/heading:tracking-[-0.03em]"
          >
            {title}
          </span>
          <span className="mt-3 block text-base font-medium tracking-[0.18em] text-muted-foreground sm:text-lg">
            {subtitle}
          </span>
        </h2>
        <p
          lang="en"
          className="col-span-2 text-[0.7rem] tracking-[0.22em] text-muted-foreground uppercase tabular-nums sm:col-span-1 sm:pb-2"
        >
          {note}
        </p>
      </div>
      <div ref={rule} aria-hidden className="reveal-rule hairline-metal" />
    </div>
  )
}
