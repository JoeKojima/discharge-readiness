import { useMemo, useState } from "react"
import { formatMinutes, parseMinutes, urgencyRank } from "../logic"
import { useStore } from "../store"
import { TaskRow } from "../components/TaskRow"
import { AddTaskModal } from "../components/Modals"
import { Icon, PageHeader, card, primaryBtn } from "../ui"

export function Tasks() {
  const { state, dispatch } = useStore()
  const [status, setStatus] = useState<"Open" | "Completed" | "All">(state.settings.showCompleted ? "All" : "Open")
  const [urgency, setUrgency] = useState("All")
  const [owner, setOwner] = useState("All")
  const [pid, setPid] = useState("All")
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)

  const all = useMemo(
    () => state.patients.flatMap((p) => p.tasks.map((task) => ({ task, patient: p }))),
    [state.patients],
  )
  const owners = useMemo(() => [...new Set(all.map((r) => r.task.owner))].sort(), [all])

  const rows = useMemo(() => {
    const q = query.toLowerCase()
    return all
      .filter(({ task, patient }) => {
        if (status === "Open" && task.completed) return false
        if (status === "Completed" && !task.completed) return false
        if (urgency !== "All" && task.urgency !== urgency) return false
        if (owner !== "All" && task.owner !== owner) return false
        if (pid !== "All" && patient.id !== pid) return false
        return [task.title, task.detail, patient.name].some((v) => v.toLowerCase().includes(q))
      })
      .sort(
        (a, b) =>
          Number(a.task.completed) - Number(b.task.completed) ||
          urgencyRank[a.task.urgency] - urgencyRank[b.task.urgency] ||
          a.patient.room.localeCompare(b.patient.room),
      )
  }, [all, status, urgency, owner, pid, query])

  const open = all.filter((r) => !r.task.completed)
  const summary = [
    { label: "Open tasks", value: open.length },
    { label: "High priority", value: open.filter((r) => r.task.urgency === "High").length },
    { label: "Mine (Dr. Chen)", value: open.filter((r) => r.task.owner === "Dr. Chen").length },
    { label: "Open effort", value: formatMinutes(open.reduce((n, r) => n + parseMinutes(r.task.effort), 0)) },
  ]
  const filtersActive = urgency !== "All" || owner !== "All" || pid !== "All" || query !== ""
  const selectCls =
    "h-9 rounded-lg border border-[#dce4e2] bg-[#fafcfb] px-2.5 text-[11px] text-[#3d554f] outline-none focus:border-[#79aa9c]"

  return (
    <>
      <PageHeader
        crumb="Tasks"
        title="Unit task board"
        subtitle="Every discharge task across your patients, sorted by priority."
        actions={
          <button onClick={() => setAdding(true)} className={primaryBtn}>
            <Icon name="plus" size={15} />
            Add task
          </button>
        }
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className={`${card} p-4`}>
            <p className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#82918d]">{s.label}</p>
            <p className="mt-1.5 text-[22px] font-semibold tracking-tight text-[#1b4037]">{s.value}</p>
          </div>
        ))}
      </section>

      <section className={`${card} overflow-hidden`}>
        <div className="border-b border-[#e7ecea] px-5 pt-5 md:px-6">
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
              <select value={pid} onChange={(e) => setPid(e.target.value)} aria-label="Filter by patient" className={selectCls}>
                <option value="All">All patients</option>
                {state.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Filter by owner" className={selectCls}>
                <option value="All">All owners</option>
                {owners.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <select value={urgency} onChange={(e) => setUrgency(e.target.value)} aria-label="Filter by urgency" className={selectCls}>
                <option value="All">All urgency</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            {filtersActive && (
              <button
                onClick={() => {
                  setUrgency("All")
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
          <div className="mt-4 flex gap-5">
            {(["Open", "Completed", "All"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s)
                  dispatch({ type: "setting", key: "showCompleted", value: s === "All" })
                }}
                className={`border-b-2 pb-3 text-[11px] font-semibold transition ${
                  status === s ? "border-[#197158] text-[#176b54]" : "border-transparent text-[#8a9794] hover:text-[#536a64]"
                }`}
              >
                {s === "All" ? "All tasks" : s}
              </button>
            ))}
            <span className="ml-auto self-center pb-3 text-[10px] text-[#8a9894]">{rows.length} shown</span>
          </div>
        </div>
        <div className="divide-y divide-[#edf1ef]">
          {rows.map(({ task, patient }) => (
            <TaskRow key={task.id} task={task} patient={patient} showPatient />
          ))}
          {rows.length === 0 && <div className="py-14 text-center text-sm text-[#81908c]">No tasks match these filters.</div>}
        </div>
      </section>

      {adding && <AddTaskModal defaultPatientId={pid !== "All" ? pid : undefined} onClose={() => setAdding(false)} />}
    </>
  )
}
