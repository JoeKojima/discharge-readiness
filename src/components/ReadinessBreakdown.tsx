import type { Patient } from "../data"
import { LONG_TASK_MIN, contributions, pct, readiness } from "../logic"
import { Icon } from "../ui"

/** How a patient's readiness is built: baseline plus each task's weighted share. */
export function ReadinessBreakdown({ patient }: { patient: Patient }) {
  const rows = contributions(patient)
  const totalPoints = rows.reduce((n, r) => n + r.points, 0)
  const gap = 100 - patient.baseline
  const earned = rows.reduce((n, r) => n + (r.task.completed ? r.percent : 0), 0)
  const sorted = [...rows].sort((a, b) => Number(a.task.completed) - Number(b.task.completed) || b.percent - a.percent)

  return (
    <section className="rounded-[18px] border border-[#dbe5e1] bg-white p-5 md:p-6" aria-label="How readiness is calculated">
      <h3 className="text-[14px] font-semibold text-[#1b4037]">How {readiness(patient)}% readiness is calculated</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-[#6c807a]">
        Readiness starts from a clinical baseline. The other {gap}% is split between the checklist tasks by weight, so a task that
        blocks discharge counts for more than a nice-to-have. Each task gets points for its urgency (High 3, Medium 2, Low 1) plus
        1 if it takes {LONG_TASK_MIN} min or more. Its share is its points ÷ {totalPoints} total points × {gap}%
        {totalPoints ? ` (${(gap / totalPoints).toFixed(1)}% per point)` : ""}.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#e7ecea] text-[9px] font-semibold uppercase tracking-[.08em] text-[#8a9894]">
              <th className="py-2 pr-3">Item</th>
              <th className="py-2 pr-3">Why</th>
              <th className="py-2 pr-3 text-right">Points</th>
              <th className="py-2 text-right">Adds</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3f2]">
            <tr>
              <td className="py-2.5 pr-3 font-semibold text-[#29463f]">Clinical baseline</td>
              <td className="py-2.5 pr-3 text-[#6c807a]">Where the patient stood clinically before the discharge checklist</td>
              <td className="py-2.5 pr-3 text-right text-[#8a9894]">—</td>
              <td className="py-2.5 text-right font-semibold text-[#29463f]">{patient.baseline}%</td>
            </tr>
            {sorted.map((r) => (
              <tr key={r.task.id}>
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-2">
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded ${
                        r.task.completed ? "bg-[#25866a] text-white" : "border border-[#b8c6c2]"
                      }`}
                      aria-label={r.task.completed ? "Done" : "Open"}
                    >
                      {r.task.completed && <Icon name="check" size={10} />}
                    </span>
                    <span className={`font-medium ${r.task.completed ? "text-[#7b8b87] line-through" : "text-[#29463f]"}`}>
                      {r.task.title}
                    </span>
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-[#6c807a]">{r.reasons.map((x) => `${x.label} (+${x.points})`).join(" · ")}</td>
                <td className="py-2.5 pr-3 text-right text-[#3d554f]">{r.points}</td>
                <td className={`py-2.5 text-right font-semibold ${r.task.completed ? "text-[#176b54]" : "text-[#8a9894]"}`}>
                  {r.task.completed ? "+" : ""}
                  {pct(r.percent)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#e7ecea] text-[11px]">
              <td className="pt-2.5 pr-3 font-semibold text-[#29463f]" colSpan={2}>
                Baseline {patient.baseline}% + completed tasks {pct(earned)}
              </td>
              <td className="pt-2.5 pr-3 text-right text-[#3d554f]">{totalPoints}</td>
              <td className="pt-2.5 text-right text-[13px] font-semibold text-[#176b54]">{readiness(patient)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-3 text-[10px] text-[#8a9894]">
        Open tasks show what they'd add when done. Adding a task spreads the same {gap}% over more points, so each existing task's
        share gets smaller.
      </p>
    </section>
  )
}
