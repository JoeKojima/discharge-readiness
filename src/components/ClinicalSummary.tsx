import { agKeys, agLabels, type AGKey, type Assessment } from "../data"

/** The clinical summary as dot points. */
export function SummaryPoints({ points, className = "" }: { points: string[]; className?: string }) {
  return (
    <ul className={`space-y-2 ${className}`} aria-label="Clinical summary">
      {points.map((p, i) => (
        <li key={i} className="flex gap-2.5 text-[12px] leading-[1.55] text-[#3d554f]">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#48a98c]" />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  )
}

const letterCls = "grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#e2f1ec] text-[10px] font-bold text-[#176b54]"

/** A–G ward assessment, read-only. */
export function AssessmentList({ assessment, compact = false }: { assessment: Assessment; compact?: boolean }) {
  return (
    <dl className={compact ? "space-y-1.5" : "space-y-2"} aria-label="A–G assessment">
      {agKeys.map((k) => (
        <div key={k} className="flex gap-2.5">
          <dt className="flex shrink-0 items-start gap-2">
            <span className={letterCls} aria-hidden>
              {k}
            </span>
            <span className={`w-[68px] pt-0.5 text-[10px] font-semibold text-[#5d7570] ${compact ? "sr-only" : ""}`}>{agLabels[k]}</span>
          </dt>
          <dd className={`min-w-0 pt-0.5 text-[11px] leading-snug ${assessment[k] ? "text-[#3d554f]" : "italic text-[#9aa8a4]"}`}>
            {compact && <span className="sr-only">{agLabels[k]}: </span>}
            {assessment[k] || "Not assessed"}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** A–G assessment for review: each letter editable, empty letters keep the previous finding. */
export function AssessmentEditor({
  value,
  previous,
  onChange,
}: {
  value: Assessment
  previous: Assessment
  onChange: (key: AGKey, text: string) => void
}) {
  return (
    <div className="space-y-2">
      {agKeys.map((k) => (
        <label key={k} className="flex items-start gap-2.5">
          <span className={`${letterCls} mt-2`} aria-hidden>
            {k}
          </span>
          <span className="mt-2.5 w-[68px] shrink-0 text-[10px] font-semibold text-[#5d7570]">{agLabels[k]}</span>
          <input
            value={value[k]}
            onChange={(e) => onChange(k, e.target.value)}
            aria-label={`${agLabels[k]} (${k})`}
            placeholder={previous[k] ? `Not covered this round · keeps: ${previous[k]}` : "Not covered this round"}
            className="h-9 min-w-0 flex-1 rounded-lg border border-[#d9e3e0] bg-white px-3 text-[11px] text-[#3d554f] outline-none placeholder:text-[#a3b0ac] focus:border-[#74a99a] focus:ring-2 focus:ring-[#dceee8]"
          />
        </label>
      ))}
    </div>
  )
}
