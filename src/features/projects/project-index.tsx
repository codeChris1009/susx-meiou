import { ArrowUpRight } from "lucide-react"
import { useRef, useState, type PointerEvent } from "react"

import { stackOf, yearOf, type Entry, type Group } from "./collection"
import { GroupLabel } from "./group-label"
import { pad } from "@/lib/format"

/**
 * LIST: the index. Names set large, one to a line, like the contents page of a monograph; hovering one dims the rest
 * and lifts its screenshot into a plate that trails the pointer. The plate is decoration (fine pointers only): the
 * name, note and link are all in the row itself.
 */
export function ProjectIndex({ groups }: { groups: readonly Group[] }) {
  const plate = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<Entry | null>(null)

  const follow = (e: PointerEvent<HTMLElement>) => {
    const el = plate.current
    if (!el || e.pointerType !== "mouse") return
    el.style.setProperty("--px", `${e.clientX}px`)
    el.style.setProperty("--py", `${e.clientY}px`)
    el.toggleAttribute(
      "data-flip",
      e.clientX > window.innerWidth - el.offsetWidth - 64
    )
  }

  return (
    <div onPointerMove={follow} onPointerLeave={() => setShown(null)}>
      {groups.map((group) => (
        <div key={group.key} className="mb-12 last:mb-0">
          {group.key && (
            <GroupLabel name={group.key} count={group.entries.length} />
          )}
          <ol className="index-list">
            {group.entries.map((p) => (
              <li key={p.repo}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener"
                  onPointerEnter={() => setShown(p)}
                  onFocus={() => setShown(null)}
                  className="index-row group/row"
                >
                  <span className="index-no tabular-nums">{pad(p.no)}</span>
                  <span className="index-name">{p.title}</span>
                  <span className="index-note">{p.description}</span>
                  <span className="index-meta tabular-nums">
                    {stackOf(p)}
                    <span aria-hidden className="mx-2 opacity-40">
                      /
                    </span>
                    {yearOf(p)}
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="index-arrow size-5 transition-transform duration-500 ease-(--ease-spring) group-hover/row:translate-x-1 group-hover/row:-translate-y-1 group-hover/row:rotate-12"
                  />
                </a>
              </li>
            ))}
          </ol>
        </div>
      ))}

      <div
        ref={plate}
        aria-hidden
        data-on={shown?.shot ? "" : undefined}
        className="index-plate"
      >
        {shown?.shot && (
          <img key={shown.repo} src={shown.shot} alt="" decoding="async" />
        )}
      </div>
    </div>
  )
}
