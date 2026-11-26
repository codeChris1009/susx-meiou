import { pad } from "@/lib/format"

/** The rubric over a group: its name, its count, and a hairline running out to the edge */
export function GroupLabel({ name, count }: { name: string; count: number }) {
  return (
    <div className="mb-5 flex items-center gap-4 text-[0.6875rem] tracking-[0.22em] uppercase">
      <span className="font-medium">{name}</span>
      <span className="text-metal tabular-nums">{pad(count)}</span>
      <span aria-hidden className="h-px flex-1 bg-foreground/10" />
    </div>
  )
}
