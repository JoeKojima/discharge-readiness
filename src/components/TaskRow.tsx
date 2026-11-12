import { useState } from "react"
import type { Patient, Task } from "../data"
import { contributions, formatMinutes, openEffort, parseMinutes, pct } from "../logic"
import { useStore } from "../store"
import { Avatar, DropdownMenu, Icon, UrgencyBadge } from "../ui"

export function TaskRow({
  task,
  patient,
  showPatient = false,
  highlight = false,
}: {
  task: Task
  patient: Patient
  showPatient?: boolean
  highlight?: boolean
}) {
  const { dispatch, notify } = useStore()
  const [why, setWhy] = useState(false)
  const pid = patient.id
  const share = contributions(patient).find((c) => c.task.id === task.id)
  return (
    <div
      id={`task-${task.id}`}
      className={`group flex scroll-mt-24 gap-3 px-5 py-4 transition hover:bg-[#fafcfb] md:px-6 ${
        task.completed ? "opacity-60" : ""
      } ${highlight ? "flash-highlight" : ""}`}
    >
      <button
        onClick={() => dispatch({ type: "toggleTask", pid, tid: task.id })}
        aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
          task.completed
            ? "border-[#25866a] bg-[#25866a] text-white"
            : "border-[#b8c6c2] bg-white hover:border-[#25866a]"
        }`}
      >
        {task.completed && <Icon name="check" size={13} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4
                className={`text-[13px] font-semibold text-[#29463f] ${task.completed ? "line-through" : ""}`}
              >
                {task.title}
              </h4>
              <UrgencyBadge urgency={task.urgency} />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#7a8985]">{task.detail}</p>
          </div>
          <DropdownMenu
            label={`Actions for ${task.title}`}
            items={[
              {
                label: task.completed ? "Mark incomplete" : "Mark complete",
                icon: "check",
                onSelect: () => dispatch({ type: "toggleTask", pid, tid: task.id }),
              },
              ...(["High", "Medium", "Low"] as const)
                .filter((u) => u !== task.urgency)
                .map((u) => ({
                  label: `Set urgency: ${u}`,
                  icon: "flag" as const,
                  onSelect: () => dispatch({ type: "setUrgency", pid, tid: task.id, urgency: u }),
                })),
              {
                label: "Delete task",
                icon: "trash",
                danger: true,
                onSelect: () => {
                  dispatch({ type: "deleteTask", pid, tid: task.id })
                  notify(`Deleted "${task.title}"`)
                },
              },
            ]}
          />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#7e8e89]">
          {showPatient && (
            <a
              href={`#/patients/${pid}`}
              className="flex items-center gap-1.5 rounded-md bg-[#f1f5f3] py-0.5 pl-0.5 pr-2 font-semibold text-[#2f5a4e] hover:bg-[#e4f1ed]"
            >
              <Avatar initials={patient.initials} color={patient.color} size={18} />
              {patient.name} · {patient.room}
            </a>
          )}
          <span className="flex items-center gap-1.5">
            <Icon name="user" size={12} />
            {task.owner}
          </span>
          <span
            className={`flex items-center gap-1.5 ${
              task.urgency === "High" && !task.completed ? "font-medium text-[#b75a48]" : ""
            }`}
          >
            <Icon name="clock" size={12} />
            {task.due}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="activity" size={12} />
            {task.effort} effort
          </span>
          <span className="rounded bg-[#f1f4f3] px-1.5 py-0.5">{task.category}</span>
          {share && (
            <button
              onClick={() => setWhy((v) => !v)}
              aria-expanded={why}
              className="rounded bg-[#e8f3ef] px-1.5 py-0.5 font-semibold text-[#176b54] hover:bg-[#dcefe8]"
            >
              {task.completed ? "Added" : "Adds"} {pct(share.percent)} readiness · why?
            </button>
          )}
          {task.automation && (
            <a href="#/tasks" className="flex items-center gap-1 rounded bg-[#e2f1ec] px-1.5 py-0.5 font-semibold text-[#176b54] hover:underline">
              <Icon name="bolt" size={10} />
              {task.automation.state === "waiting"
                ? task.automation.log[task.automation.log.length - 1].text
                : task.automation.state === "escalated"
                  ? `Escalated to ${task.owner}`
                  : "Automated"}
            </a>
          )}
        </div>
        {why && share && <ContributionWhy patient={patient} task={task} />}
      </div>
    </div>
  )
}

/** Why a task adds what it adds to readiness, and its share of the open workload. */
export function ContributionWhy({ patient, task }: { patient: Patient; task: Task }) {
  const all = contributions(patient)
  const c = all.find((x) => x.task.id === task.id)
  if (!c) return null
  const totalPoints = all.reduce((n, x) => n + x.points, 0)
  const gap = 100 - patient.baseline
  const open = openEffort(patient)
  const mins = parseMinutes(task.effort)
  return (
    <div className="mt-2.5 rounded-lg border border-[#dcebe5] bg-[#f6fbf9] px-3 py-2.5 text-[10px] leading-relaxed text-[#4f6862]">
      <p className="font-semibold text-[#29463f]">
        {task.completed ? "Added" : "Adds"} {pct(c.percent)} to {patient.name}'s readiness
      </p>
      <ul className="mt-1 space-y-0.5">
        {c.reasons.map((r) => (
          <li key={r.label}>
            +{r.points} pt{r.points === 1 ? "" : "s"} · {r.label}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[#6c807a]">
        {c.points} of {totalPoints} checklist points × the {gap}% between baseline ({patient.baseline}%) and ready = {pct(c.percent)}.
      </p>
      {!task.completed && open > 0 && (
        <p className="mt-1 text-[#6c807a]">
          Workload: {task.effort}, {pct((mins / open) * 100)} of {patient.name.split(" ")[0]}'s {formatMinutes(open)} of open work.
        </p>
      )}
    </div>
  )
}