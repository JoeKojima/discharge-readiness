import { useMemo, useState } from "react"
import { blocker, formatMinutes, openEffort, openTasks, readiness, status, statuses, type Status } from "../logic"
import { navigate, useStore } from "../store"
import { AddPatientModal } from "../components/Modals"
import { Avatar, Icon, PageHeader, ProgressRing, ReadinessBar, StatusBadge, card, primaryBtn } from "../ui"

type Sort = "readiness-asc" | "readiness-desc" | "room" | "name" | "los"

export function Patients() {
  const { state } = useStore()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"All" | Status>("All")
  const [sort, setSort] = useState<Sort>("readiness-desc")
  const [adding, setAdding] = useState(false)
  const patients = state.patients

  const stats = useMemo(() => {
    const scores = patients.map(readiness)
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const today = patients.filter((p) => ["Ready for discharge", "Likely discharge today"].includes(status(p))).length
    const high = patients.reduce((n, p) => n + openTasks(p).filter((t) => t.urgency === "High").length, 0)
    const placements = patients.filter((p) => /nursing|rehab/i.test(p.disposition)).length
    const effort = patients.reduce((n, p) => n + openEffort(p), 0)
    return { avg, today, high, placements, effort }
  }, [patients])

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: patients.length }
    for (const s of statuses) c[s] = patients.filter((p) => status(p) === s).length
    return c
  }, [patients])

  const rows = useMemo(() => {
    const q = query.toLowerCase()
    const list = patients.filter(
      (p) =>
        (filter === "All" || status(p) === filter) &&
        [p.name, p.room, p.diagnosis, p.mrn, p.disposition].some((v) => v.toLowerCase().includes(q)),
    )
    const by: Record<Sort, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
      "readiness-desc": (a, b) => readiness(b) - readiness(a),
      "readiness-asc": (a, b) => readiness(a) - readiness(b),
      room: (a, b) => a.room.localeCompare(b.room),
      name: (a, b) => a.name.split(" ").pop()!.localeCompare(b.name.split(" ").pop()!),
      los: (a, b) => b.los - a.los,
    }
    return [...list].sort(by[sort])
  }, [patients, query, filter, sort])

  const statCards: { label: string; value: string; note: string; icon: "patients" | "check" | "activity" | "alert" | "building" }[] = [
    { label: "Patients", value: String(patients.length), note: "On your 4W list", icon: "patients" },
    { label: "Discharging today", value: String(stats.today), note: "Ready or likely today", icon: "check" },
    { label: "Avg. readiness", value: `${stats.avg}%`, note: `${formatMinutes(stats.effort)} of open work`, icon: "activity" },
    { label: "High-priority tasks", value: String(stats.high), note: "Open across all patients", icon: "alert" },
    { label: "Post-acute placements", value: String(stats.placements), note: "SNF or inpatient rehab", icon: "building" },
  ]

  return (
    <>
      <PageHeader
        crumb="Overview"
        title="Patient dashboard"
        subtitle="Discharge readiness for every patient on your list."
        actions={
          <button onClick={() => setAdding(true)} className={primaryBtn}>
            <Icon name="plus" size={15} />
            Add patient
          </button>
        }
      />

      <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {statCards.map((s, i) => (
          <div key={s.label} className={`${card} p-4 ${i === 0 ? "col-span-2 md:col-span-1" : ""}`}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#82918d]">{s.label}</p>
              <div
                className={`grid h-7 w-7 place-items-center rounded-lg ${
                  s.icon === "alert" ? "bg-[#fde7e1] text-[#bf5946]" : "bg-[#e2f1ec] text-[#16745a]"
                }`}
              >
                <Icon name={s.icon} size={14} />
              </div>
            </div>
            <p className="mt-2 text-[24px] font-semibold tracking-tight text-[#1b4037]">{s.value}</p>
            <p className="text-[10px] text-[#84938f]">{s.note}</p>
          </div>
        ))}
      </section>

      <section className={`${card} overflow-hidden`}>
        <div className="border-b border-[#e7ecea] px-5 pt-5 md:px-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h3 className="text-[16px] font-semibold tracking-[-.02em] text-[#1b4037]">All patients</h3>
              <p className="mt-0.5 text-[11px] text-[#82908d]">Select a patient to open their discharge command centre.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Icon name="search" size={14} className="absolute left-3 top-2.5 text-[#8a9995]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, room, diagnosis"
                  aria-label="Search patients"
                  className="h-9 w-full rounded-lg border border-[#dce4e2] bg-[#fafcfb] pl-9 pr-3 text-[11px] outline-none focus:border-[#79aa9c] sm:w-56"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label="Sort patients"
                className="h-9 rounded-lg border border-[#dce4e2] bg-[#fafcfb] px-2.5 text-[11px] text-[#3d554f] outline-none focus:border-[#79aa9c]"
              >
                <option value="readiness-desc">Most ready first</option>
                <option value="readiness-asc">Least ready first</option>
                <option value="room">Room</option>
                <option value="name">Last name</option>
                <option value="los">Longest stay</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-5 overflow-x-auto">
            {(["All", ...statuses] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`shrink-0 border-b-2 pb-3 text-[11px] font-semibold transition ${
                  filter === s ? "border-[#197158] text-[#176b54]" : "border-transparent text-[#8a9794] hover:text-[#536a64]"
                }`}
              >
                {s === "All" ? "All patients" : s}
                <span className="ml-1.5 rounded-full bg-[#ecf1ef] px-1.5 py-0.5 text-[9px]">{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(200px,1.4fr)_minmax(150px,1.2fr)_minmax(120px,.8fr)_70px_minmax(160px,1.2fr)_150px] gap-4 border-b border-[#edf1ef] bg-[#fafcfb] px-6 py-2.5 text-[9px] font-semibold uppercase tracking-[.08em] text-[#8a9894] lg:grid">
          <span>Patient</span>
          <span>Diagnosis</span>
          <span>Readiness</span>
          <span>Open</span>
          <span>Primary blocker</span>
          <span>Status</span>
        </div>

        <ul className="divide-y divide-[#edf1ef]">
          {rows.map((p) => {
            const r = readiness(p)
            const b = blocker(p)
            const open = openTasks(p)
            return (
              <li key={p.id}>
                <button
                  onClick={() => navigate(`/patients/${p.id}`)}
                  className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-[#f6faf8] md:px-6 lg:grid-cols-[minmax(200px,1.4fr)_minmax(150px,1.2fr)_minmax(120px,.8fr)_70px_minmax(160px,1.2fr)_150px] lg:items-center lg:gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="lg:hidden">
                      <ProgressRing value={r} size={46} />
                    </div>
                    <Avatar initials={p.initials} color={p.color} size={36} className="hidden lg:grid" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#29463f]">{p.name}</p>
                      <p className="text-[10px] text-[#82918d]">
                        {p.age} {p.sex} · {p.room} · LOS {p.los}d
                      </p>
                    </div>
                    <div className="lg:hidden">
                      <StatusBadge status={status(p)} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-[#3d554f]">{p.diagnosis}</p>
                    <p className="truncate text-[10px] text-[#8a9894]">{p.disposition}</p>
                  </div>
                  <div className="hidden lg:block">
                    <ReadinessBar value={r} />
                  </div>
                  <p className="hidden text-[12px] font-semibold text-[#253f39] lg:block">
                    {open.length}
                    <span className="font-normal text-[#8a9894]">/{p.tasks.length}</span>
                  </p>
                  <div className="min-w-0">
                    {b ? (
                      <p className="flex items-center gap-1.5 text-[11px] text-[#5b4a45]">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${b.urgency === "High" ? "bg-[#d75544]" : "bg-[#d9a24a]"}`}
                        />
                        <span className="truncate">{b.title}</span>
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-[11px] text-[#2f7a62]">
                        <Icon name="check" size={12} /> {p.tasks.length ? "No blockers" : "No checklist yet"}
                      </p>
                    )}
                    <p className="text-[10px] text-[#8a9894] lg:hidden">
                      {open.length} of {p.tasks.length} tasks open · Target {p.target}
                    </p>
                  </div>
                  <div className="hidden lg:block">
                    <StatusBadge status={status(p)} />
                    <p className="mt-1 text-[10px] text-[#8a9894]">Target {p.target}</p>
                  </div>
                </button>
              </li>
            )
          })}
          {rows.length === 0 && (
            <li className="py-14 text-center text-sm text-[#81908c]">
              {patients.length ? "No patients match this view." : "No patients on your list. Add one to get started."}
            </li>
          )}
        </ul>
      </section>

      {adding && <AddPatientModal onClose={() => setAdding(false)} />}
    </>
  )
}
