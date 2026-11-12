import { useEffect, useMemo, useState } from "react"
import type { Patient, Task } from "../data"
import { clockTime, contributions, pct, dueAt, dueBucket, dueBuckets, formatMinutes, parseMinutes, relativeDue, urgencyRank, type DueBucket } from "../logic"
import { playbookFor } from "../automation"
import { useStore } from "../store"
import { AddTaskModal } from "../components/Modals"
import { ContributionWhy } from "../components/TaskRow"
import { Avatar, DropdownMenu, Icon, PageHeader, card, primaryBtn } from "../ui"

type View = "Open" | "JMO list" | "Automations" | "Completed"
type Group = "time" | "patient" | "owner"
type Row = { task: Task; patient: Patient; at: Date | null }

// Re-render every 30 s so due times and overdue states stay current.
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

const bucketTone: Record<DueBucket, string> = {
  Overdue: "text-[#b14f3d]",
  "Due in the next hour": "text-[#99691f]",
  "Later today": "text-[#2f5a4e]",
  "Tomorrow and later": "text-[#5d7570]",
  "No due time": "text-[#7b8b87]",
}

export function Tasks() {
  const { state, dispatch } = useStore()
  const now = useNow()
  const [view, setView] = useState<View>("Open")
  const [group, setGroup] = useState<Group>("time")
  const [owner, setOwner] = useState("All")
  const [pid, setPid] = useState("All")
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<Set<string>>(new Set())

  const all: Row[] = useMemo(
    () => state.patients.flatMap((p) => p.tasks.map((task) => ({ task, patient: p, at: dueAt(task, p, now) }))),
    [state.patients, now],
  )

  // Waiting automations escalate on their own once their deadline passes.
  useEffect(() => {
    for (const { task, patient } of all) {
      const run = task.automation
      if (run?.state === "waiting" && new Date(run.deadline) < now)
        dispatch({ type: "automationResolve", pid: patient.id, tid: task.id, outcome: "fallback", timedOut: true })
    }
  }, [all, now, dispatch])

  const openRows = all.filter((r) => !r.task.completed)
  const counts = {
    overdue: openRows.filter((r) => dueBucket(r.at, now) === "Overdue").length,
    soon: openRows.filter((r) => dueBucket(r.at, now) === "Due in the next hour").length,
    automations: openRows.filter((r) => r.task.automation?.state === "waiting").length,
    jmo: openRows.filter((r) => r.task.owner === "JMO").length,
  }
  const owners = useMemo(() => [...new Set(all.map((r) => r.task.owner))].sort(), [all])

  const rows = useMemo(() => {
    const q = query.toLowerCase()
    return all
      .filter(({ task, patient }) => {
        if (view === "Completed" ? !task.completed : task.completed) return false
        if (view === "JMO list" && task.owner !== "JMO") return false
        if (view === "Automations" && !task.automation) return false
        if (owner !== "All" && task.owner !== owner) return false
        if (pid !== "All" && patient.id !== pid) return false
        return [task.title, task.detail, patient.name, task.owner].some((v) => v.toLowerCase().includes(q))
      })
      .sort(
        (a, b) =>
          (a.at?.getTime() ?? Infinity) - (b.at?.getTime() ?? Infinity) ||
          urgencyRank[a.task.urgency] - urgencyRank[b.task.urgency] ||
          a.patient.room.localeCompare(b.patient.room),
      )
  }, [all, view, owner, pid, query])

  const groups = useMemo(() => {
    const map = new Map<string, Row[]>()
    const key = (r: Row) =>
      view === "Completed" ? "Completed" : group === "time" ? dueBucket(r.at, now) : group === "patient" ? r.patient.name : r.task.owner
    for (const r of rows) map.set(key(r), [...(map.get(key(r)) ?? []), r])
    const order = view === "Completed" ? ["Completed"] : group === "time" ? (dueBuckets as string[]) : [...map.keys()].sort()
    return order.filter((k) => map.has(k)).map((k) => ({ name: k, rows: map.get(k)! }))
  }, [rows, group, view, now])

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const filtersActive = owner !== "All" || pid !== "All" || query !== ""
  const selectCls =
    "h-9 rounded-lg border border-[#dce4e2] bg-[#fafcfb] px-2.5 text-[11px] text-[#3d554f] outline-none focus:border-[#79aa9c]"
  const stat = (label: string, value: number | string, tone: string, onClick?: () => void, active = false) => (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`${card} p-4 text-left transition enabled:hover:border-[#b9ccc6] ${active ? "ring-2 ring-[#b9dfd2]" : ""}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#82918d]">{label}</p>
      <p className={`mt-1.5 text-[22px] font-semibold tracking-tight ${tone}`}>{value}</p>
    </button>
  )

  return (
    <>
      <PageHeader
        crumb="Tasks"
        title="Unit task board"
        subtitle="What's due next across your patients, in time order. Routine steps can run on their own."
        actions={
          <button onClick={() => setAdding(true)} className={primaryBtn}>
            <Icon name="plus" size={15} />
            Add task
          </button>
        }
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat("Overdue", counts.overdue, counts.overdue ? "text-[#b14f3d]" : "text-[#1b4037]", () => {
          setView("Open")
          setGroup("time")
        })}
        {stat("Due in the next hour", counts.soon, counts.soon ? "text-[#99691f]" : "text-[#1b4037]", () => {
          setView("Open")
          setGroup("time")
        })}
        {stat("Automations waiting", counts.automations, "text-[#1b4037]", () => setView("Automations"), view === "Automations")}
        {stat("JMO list", counts.jmo, "text-[#1b4037]", () => setView("JMO list"), view === "JMO list")}
      </section>

      <section className={`${card} overflow-hidden`}>
        <div className="border-b border-[#e7ecea] px-5 pt-4 md:px-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Icon name="search" size={14} className="absolute left-3 top-2.5 text-[#8a9995]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks or patients"
                aria-label="Search tasks"
                className="h-9 w-full rounded-lg border border-[#dce4e2] bg-[#fafcfb] pl-9 pr-3 text-[11px] outline-none focus:border-[#79aa9c] lg:max-w-xs"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 lg:flex">
              <select value={group} onChange={(e) => setGroup(e.target.value as Group)} aria-label="Group tasks by" className={selectCls}>
                <option value="time">Group: due time</option>
                <option value="patient">Group: patient</option>
                <option value="owner">Group: role</option>
              </select>
              <select value={pid} onChange={(e) => setPid(e.target.value)} aria-label="Filter by patient" className={selectCls}>
                <option value="All">All patients</option>
                {state.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Filter by role" className={selectCls}>
                <option value="All">All roles</option>
                {owners.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            {filtersActive && (
              <button
                onClick={() => {
                  setOwner("All")
                  setPid("All")
                  setQuery("")
                }}
                className="text-[11px] font-semibold text-[#197158] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="mt-3 flex gap-5 overflow-x-auto" role="tablist" aria-label="Task views">
            {(["Open", "JMO list", "Automations", "Completed"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`shrink-0 border-b-2 pb-3 text-[11px] font-semibold transition ${
                  view === v ? "border-[#197158] text-[#176b54]" : "border-transparent text-[#8a9794] hover:text-[#536a64]"
                }`}
              >
                {v}
                {v === "JMO list" && counts.jmo > 0 && <span className="ml-1.5 rounded-full bg-[#ecf1ef] px-1.5 py-0.5 text-[9px]">{counts.jmo}</span>}
              </button>
            ))}
            <span className="ml-auto shrink-0 self-center pb-3 text-[10px] text-[#8a9894]">
              {rows.length} shown · {formatMinutes(rows.reduce((n, r) => n + (r.task.completed ? 0 : parseMinutes(r.task.effort)), 0))} of work
            </span>
          </div>
        </div>

        {(view === "Automations" || counts.automations > 0) && (
          <p className="flex items-start gap-2 border-b border-[#edf1ef] bg-[#fafcfb] px-5 py-2.5 text-[10px] text-[#6c807a] md:px-6">
            <Icon name="bolt" size={12} className="mt-0.5 shrink-0 text-[#176b54]" />
            Automations are simulated in this demo: nothing is actually sent to pathology, paging, pharmacy or booking systems.
          </p>
        )}

        {groups.map((g) => (
          <section key={g.name} aria-label={g.name}>
            <h3
              className={`sticky top-0 z-10 flex items-center gap-2 border-b border-[#edf1ef] bg-[#f6f9f8] px-5 py-2 text-[10px] font-semibold uppercase tracking-[.08em] md:px-6 ${
                group === "time" ? bucketTone[g.name as DueBucket] ?? "text-[#5d7570]" : "text-[#5d7570]"
              }`}
            >
              {g.name}
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] text-[#7b8b87] ring-1 ring-[#e2e9e6]">{g.rows.length}</span>
            </h3>
            <ul className="divide-y divide-[#edf1ef]">
              {g.rows.map((r) => (
                <BoardRow key={r.task.id} row={r} now={now} expanded={open.has(r.task.id)} onToggle={() => toggle(r.task.id)} />
              ))}
            </ul>
          </section>
        ))}
        {rows.length === 0 && (
          <div className="py-14 text-center text-sm text-[#81908c]">
            {view === "JMO list"
              ? "Nothing on the JMO list."
              : view === "Automations"
                ? "No automations yet. Open a task with the ⚡ Automate button to start one."
                : "No tasks match these filters."}
          </div>
        )}
      </section>

      {adding && <AddTaskModal defaultPatientId={pid !== "All" ? pid : undefined} onClose={() => setAdding(false)} />}
    </>
  )
}

function BoardRow({ row, now, expanded, onToggle }: { row: Row; now: Date; expanded: boolean; onToggle: () => void }) {
  const { dispatch, notify } = useStore()
  const { task, patient, at } = row
  const pid = patient.id
  const run = task.automation
  const pb = playbookFor(task)
  const share = contributions(patient).find((c) => c.task.id === task.id)
  const overdue = !task.completed && at && at < now
  const dot = task.urgency === "High" ? "bg-[#d75544]" : task.urgency === "Medium" ? "bg-[#d9a24a]" : "bg-[#9fb3ad]"

  const automate = () => {
    dispatch({ type: "automationStart", pid, tid: task.id })
    if (!expanded) onToggle()
    notify(`${pb!.name} automation started for ${patient.name}`)
  }
  const resolve = (outcome: "success" | "fallback") => {
    dispatch({ type: "automationResolve", pid, tid: task.id, outcome })
    notify(outcome === "success" ? `"${task.title}" done` : `"${task.title}" handed to ${pb!.escalateTo}`)
  }

  return (
    <li id={`task-${task.id}`} className={`px-5 py-3 transition hover:bg-[#fafcfb] md:px-6 ${task.completed ? "opacity-60" : ""}`}>
      <div className="grid grid-cols-[20px_1fr] items-start gap-3 sm:grid-cols-[76px_20px_1fr_auto]">
        <div className="col-span-2 flex items-baseline gap-2 sm:col-span-1 sm:block">
          <p className={`text-[12px] font-semibold ${overdue ? "text-[#b14f3d]" : "text-[#29463f]"}`}>{at ? clockTime(at) : task.completed ? "Done" : "—"}</p>
          <p className={`text-[9px] ${overdue ? "font-semibold text-[#b14f3d]" : "text-[#8a9894]"}`}>
            {at ? relativeDue(at, now) : task.completed ? task.due.replace("Completed ", "") : task.due}
          </p>
        </div>
        <button
          onClick={() => dispatch({ type: "toggleTask", pid, tid: task.id })}
          aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
          className={`mt-0.5 grid h-5 w-5 place-items-center rounded-md border transition ${
            task.completed ? "border-[#25866a] bg-[#25866a] text-white" : "border-[#b8c6c2] bg-white hover:border-[#25866a]"
          }`}
        >
          {task.completed && <Icon name="check" size={13} />}
        </button>
        <div className="min-w-0">
          <button onClick={onToggle} aria-expanded={expanded} className="flex max-w-full items-center gap-2 text-left">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} title={`${task.urgency} urgency`} />
            <span className={`truncate text-[12px] font-semibold text-[#29463f] ${task.completed ? "line-through" : ""}`}>{task.title}</span>
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#7e8e89]">
            <a href={`#/patients/${pid}`} className="flex items-center gap-1.5 font-semibold text-[#2f5a4e] hover:underline">
              <Avatar initials={patient.initials} color={patient.color} size={16} />
              {patient.name} · {patient.room.replace("4W · ", "")}
            </a>
            <span className={task.owner === "JMO" ? "rounded bg-[#fff0d7] px-1.5 py-0.5 font-semibold text-[#936018]" : ""}>{task.owner}</span>
            <span>{task.effort}</span>
            {share && (
              <span className="font-semibold text-[#176b54]" title={share.reasons.map((r) => `+${r.points} ${r.label}`).join("\n")}>
                {task.completed ? "+" : ""}
                {pct(share.percent)} readiness
              </span>
            )}
            {run && <AutomationPill run={run} />}
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-end gap-1.5 sm:col-span-1">
          {pb && !run && !task.completed && (
            <button
              onClick={automate}
              className="flex items-center gap-1 rounded-lg border border-[#cfe1db] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#176b54] hover:bg-[#edf6f2]"
              title={`${pb.name}: ${pb.steps(task).join(" → ")} → ${pb.waitFor.toLowerCase()}`}
            >
              <Icon name="bolt" size={12} />
              Automate
            </button>
          )}
          {run?.state === "waiting" && pb && (
            <>
              <button
                onClick={() => resolve("success")}
                className="rounded-lg bg-[#176b54] px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-[#105b45]"
              >
                {pb.successLabel}
              </button>
              <button
                onClick={() => resolve("fallback")}
                className="rounded-lg border border-[#ecd2c9] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#a6432f] hover:bg-[#fdf3ef]"
              >
                {pb.fallbackLabel}
              </button>
            </>
          )}
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
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 sm:ml-[108px]">
          <p className="text-[11px] leading-relaxed text-[#5e7570]">{task.detail}</p>
          <p className="text-[10px] text-[#8a9894]">
            {task.urgency} urgency · {task.category} · {task.completed ? task.due : `Due label: ${task.due}`}
          </p>
          <ContributionWhy patient={patient} task={task} />
          {run ? (
            <ol className="space-y-1.5 rounded-xl border border-[#e2e9e6] bg-[#fafcfb] p-3" aria-label="Automation log">
              {run.log.map((l, i) => {
                const last = i === run.log.length - 1
                const waiting = last && run.state === "waiting"
                return (
                  <li key={i} className="flex items-start gap-2 text-[10px]">
                    <span
                      className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                        waiting
                          ? "bg-[#fff0d7] text-[#936018]"
                          : last && run.state === "escalated"
                            ? "bg-[#fde7e1] text-[#b14f3d]"
                            : "bg-[#dcefe8] text-[#176b54]"
                      }`}
                    >
                      <Icon name={waiting ? "clock" : last && run.state === "escalated" ? "arrow" : "check"} size={9} />
                    </span>
                    <span className="w-14 shrink-0 text-[#8a9894]">{l.time}</span>
                    <span className="text-[#3d554f]">
                      {l.text}
                      {waiting && pb && (
                        <span className="text-[#8a9894]">
                          {" "}
                          · goes to {pb.escalateTo === "JMO" ? "the JMO list" : pb.escalateTo} at {clockTime(new Date(run.deadline))} if no response
                        </span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ol>
          ) : (
            pb &&
            !task.completed && (
              <p className="text-[10px] text-[#6c807a]">
                <span className="font-semibold">⚡ {pb.name} automation:</span> {pb.steps(task).join(" → ")} → {pb.waitFor.toLowerCase()}. If
                that doesn't happen in {pb.timeoutMin} min, it goes to {pb.escalateTo === "JMO" ? "the JMO task list" : pb.escalateTo}.
              </p>
            )
          )}
        </div>
      )}
    </li>
  )
}

function AutomationPill({ run }: { run: NonNullable<Task["automation"]> }) {
  const tone =
    run.state === "waiting"
      ? "bg-[#fff0d7] text-[#936018]"
      : run.state === "escalated"
        ? "bg-[#fde7e1] text-[#a6432f]"
        : "bg-[#dcefe8] text-[#176b54]"
  const text =
    run.state === "waiting" ? run.log[run.log.length - 1].text : run.state === "escalated" ? `Escalated from ${run.escalatedFrom}` : "Automated"
  return (
    <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold ${tone}`}>
      <Icon name="bolt" size={10} />
      {text}
    </span>
  )
}
