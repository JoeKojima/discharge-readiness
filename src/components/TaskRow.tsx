import type { Patient, Task } from "../data"
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
  const pid = patient.id
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
      </div>
    </div>
  )
}
