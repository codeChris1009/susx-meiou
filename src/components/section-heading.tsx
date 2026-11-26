import { useReveal } from "@/hooks/use-reveal"
import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  id: string
  index: string
  title: string
  note: string
  className?: string
}

/** Numbered section title: a metal numeral, the title, a note on the right and an engraved rule that draws itself in */
export function SectionHeading({
  id,
  index,
  title,
  note,
  className,
}: SectionHeadingProps) {
  const reveal = useReveal<HTMLDivElement>()
  const rule = useReveal<HTMLDivElement>()
  return (
    <div className={cn("mb-10", className)}>
      <div
        ref={reveal}
        className="reveal flex items-end justify-between gap-6 pb-5"
      >
        <h2
          id={id}
          className="group/heading flex cursor-default items-baseline gap-4 transition-transform duration-500 ease-(--ease-spring) active:scale-[0.98]"
        >
          <span
            aria-hidden
            className="text-metal font-mono text-5xl leading-none font-light tracking-tighter transition-[translate,filter] duration-700 ease-(--ease-out-expo) group-hover/heading:-translate-x-1 group-hover/heading:brightness-125 sm:text-6xl"
          >
            {index}
          </span>
          <span className="display-cjk text-2xl font-semibold sm:text-3xl">
            {title}
          </span>
        </h2>
        <p className="pb-1 font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          {note}
        </p>
      </div>
      <div ref={rule} aria-hidden className="reveal-rule hairline-metal" />
    </div>
  )
}
