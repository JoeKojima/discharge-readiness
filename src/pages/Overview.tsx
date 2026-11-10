import { useEffect, useMemo, useRef, useState } from "react"
import { facilities, staff, type Patient } from "../data"
import { blocker, formatMinutes, openEffort, readiness, sortTasks, status } from "../logic"
import { navigate, useStore } from "../store"
import { TaskRow } from "../components/TaskRow"
import { AssessmentList, SummaryPoints } from "../components/ClinicalSummary"
import { AddTaskModal, CareTeamModal, GeneratorModal } from "../components/Modals"
import { Avatar, DropdownMenu, Icon, ProgressRing, StatusBadge } from "../ui"

export function Overview({ patient }: { patient: Patient }) {
  const { state, dispatch, notify } = useStore()
  const [filter, setFilter] = useState<"All tasks" | "Open" | "Completed">("All tasks")
  const [search, setSearch] = useState("")
  const [showPatients, setShowPatients] = useState(false)
  const [modal, setModal] = useState<null | "generate" | "team" | "task">(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [selectedFacility, setSelectedFacility] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPatients) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setShowPatients(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [showPatients])

  const tasks = patient.tasks
  const completed = tasks.filter((t) => t.completed).length
  const ready = readiness(patient)
  const block = blocker(patient)
  const team = staff.filter((s) => patient.careTeam.includes(s.id))

  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase()
    return sortTasks(tasks).filter((t) => {
      const matches = filter === "All tasks" || (filter === "Completed" ? t.completed : !t.completed)
      return (
        matches &&
        (t.title.toLowerCase().includes(q) ||
          t.detail.toLowerCase().includes(q) ||
          t.owner.toLowerCase().includes(q))
      )
    })
  }, [tasks, filter, search])

  const viewTask = (id: string) => {
    setFilter("All tasks")
    setSearch("")
    setHighlightId(id)
    window.setTimeout(() => {
      document.getElementById(`task-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 50)
    window.setTimeout(() => setHighlightId(null), 1700)
  }

  const facility = facilities[selectedFacility]

  return (
    <>
      <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#6e807b]">
            <a href="#/" className="hover:text-[#184f41]">Overview</a>
            <Icon name="chevron" size={12} />
            <span className="text-[#184f41]">My patients · {patient.name}</span>
          </div>
          <h2 className="text-[27px] font-semibold tracking-[-.04em] text-[#173b33]">Discharge command centre</h2>
          <p className="mt-1 text-[13px] text-[#70807c]">AI-prioritized actions from rounds, notes, and the care team.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal("generate")}
            className="flex items-center gap-2 rounded-xl bg-[#156d53] px-4 py-2.5 text-[12px] font-semibold text-white sm:hidden"
          >
            <Icon name="sparkles" size={16} />
            Generate
          </button>
          <div className="relative flex-1 sm:flex-none" ref={menuRef}>
            <button
              onClick={() => setShowPatients(!showPatients)}
              aria-haspopup="listbox"
              aria-expanded={showPatients}
              aria-label={`Switch patient (current: ${patient.name})`}
              className="flex w-full min-w-[205px] items-center gap-3 rounded-xl border border-[#d9e3e0] bg-white px-3 py-2.5 text-left shadow-sm hover:border-[#b9ccc6]"
            >
              <Avatar initials={patient.initials} color={patient.color} />
              <div>
                <div className="text-[12px] font-semibold text-[#29453e]">{patient.name}</div>
                <div className="text-[10px] text-[#81908c]">{patient.room}</div>
              </div>
              <Icon name="chevron" size={14} className="ml-auto rotate-90 text-[#84928e]" />
            </button>
            {showPatients && (
              <div
                role="listbox"
                className="absolute right-0 top-[54px] z-30 max-h-[420px] w-[290px] overflow-y-auto rounded-2xl border border-[#dce5e2] bg-white p-2 shadow-xl"
              >
                {state.patients.map((p) => (
                  <button
                    key={p.id}
                    role="option"
                    aria-selected={p.id === patient.id}
                    onClick={() => {
                      setShowPatients(false)
                      navigate(`/patients/${p.id}`)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-[#f0f5f3] ${p.id === patient.id ? "bg-[#f4f8f6]" : ""}`}
                  >
                    <Avatar initials={p.initials} color={p.color} size={36} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">{p.name}</div>
                      <div className="truncate text-[10px] text-slate-500">
                        {p.age} {p.sex} · {p.room}
                      </div>
                    </div>
                    <span className="ml-auto text-xs font-semibold text-[#187158]">{readiness(p)}%</span>
                  </button>
                ))}
                <a
                  href="#/"
                  onClick={() => setShowPatients(false)}
                  className="mt-1 flex items-center justify-center gap-1.5 rounded-xl border-t border-[#edf1ef] p-2.5 text-[11px] font-semibold text-[#197158] hover:bg-[#f0f5f3]"
                >
                  View all patients <Icon name="arrow" size={12} />
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1.5fr_.72fr_.72fr]">
        <div className="relative overflow-hidden rounded-[18px] border border-[#dbe5e1] bg-white p-5 shadow-[0_2px_5px_rgba(30,65,55,.03)] md:p-6">
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
            <ProgressRing value={ready} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[19px] font-semibold tracking-[-.025em] text-[#183d34]">{patient.name}</h3>
                <StatusBadge status={status(patient)} />
              </div>
              <p className="mt-1 text-[11px] text-[#758681]">
                {patient.age} {patient.sex} · MRN {patient.mrn}
                <span className="mx-1.5 text-[#c0cbc8]">|</span>
                {patient.diagnosis}
                <span className="mx-1.5 text-[#c0cbc8]">|</span>
                LOS {patient.los}d
              </p>
              <div className="mt-5 grid grid-cols-3 gap-4 border-t border-[#edf1ef] pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#85928f]">Open tasks</p>
                  <p className="mt-1 text-[18px] font-semibold text-[#253f39]">{tasks.length - completed}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#85928f]">Est. effort</p>
                  <p className="mt-1 text-[18px] font-semibold text-[#253f39]">{formatMinutes(openEffort(patient))}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#85928f]">Target</p>
                  <p className="mt-1 text-[18px] font-semibold text-[#253f39]">{patient.target}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#e8f6f1]/70" />
        </div>

        {block ? (
          <div className="rounded-[18px] border border-[#f0d6ce] bg-[#fffaf8] p-5">
            <div className="flex items-start justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#fde7e1] text-[#bf5946]">
                <Icon name="alert" size={18} />
              </div>
              <span className="rounded-full bg-[#f8ded7] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#ae4d3d]">
                Attention
              </span>
            </div>
            <p className="mt-4 text-[11px] font-medium text-[#8a716b]">Primary blocker</p>
            <p className="mt-1 text-[14px] font-semibold leading-snug text-[#503d38]">{block.title}</p>
            <button
              onClick={() => viewTask(block.id)}
              className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-[#ae4d3d]"
            >
              View task <Icon name="arrow" size={12} />
            </button>
          </div>
        ) : (
          <div className="rounded-[18px] border border-[#cfe3dc] bg-[#f5fbf8] p-5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#dcefe8] text-[#176b54]">
              <Icon name="check" size={18} />
            </div>
            <p className="mt-4 text-[11px] font-medium text-[#658078]">Primary blocker</p>
            <p className="mt-1 text-[14px] font-semibold leading-snug text-[#205c4c]">
              {tasks.length ? "No open blockers — ready for discharge" : "No tasks yet — generate a checklist"}
            </p>
            {tasks.length > 0 ? (
              <button
                onClick={() => {
                  dispatch({ type: "dischargePatient", pid: patient.id })
                  notify(`${patient.name} discharged and removed from your list`)
                  navigate("/")
                }}
                className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-[#176b54]"
              >
                Discharge patient <Icon name="arrow" size={12} />
              </button>
            ) : (
              <button
                onClick={() => setModal("generate")}
                className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-[#176b54]"
              >
                Generate checklist <Icon name="arrow" size={12} />
              </button>
            )}
          </div>
        )}

        <div className="rounded-[18px] border border-[#dce5e2] bg-white p-5">
          <div className="flex items-start justify-between">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e2f1ec] text-[#16745a]">
              <Icon name="clock" size={18} />
            </div>
            <DropdownMenu
              label="Discharge confidence actions"
              items={[
                { label: "Review rounds notes", icon: "stethoscope", onSelect: () => navigate(`/rounds/${patient.id}`) },
                { label: "Re-run checklist", icon: "refresh", onSelect: () => setModal("generate") },
              ]}
            />
          </div>
          <p className="mt-4 text-[11px] font-medium text-[#788985]">Discharge confidence</p>
          <p className="mt-1 text-[14px] font-semibold text-[#29463f]">{patient.confidence}</p>
          <div className="mt-4 flex items-end gap-1">
            {patient.trend.map((h, i) => (
              <span key={i} className="w-full rounded-sm bg-[#b9dfd2]" style={{ height: h }} />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-[#84938f]">{patient.trendNote}</p>
        </div>
      </section>

      {patient.snf && (
        <section className="mb-5 overflow-hidden rounded-[18px] border border-[#cfe0da] bg-white shadow-[0_2px_8px_rgba(30,65,55,.04)]">
          <div className="grid lg:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center md:px-6">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#dcefe8] text-[#176b54]">
                <Icon name="building" size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#197158]">SNF placement recommendation</p>
                  <span className="rounded-full bg-[#e6f2ee] px-2 py-0.5 text-[8px] font-semibold text-[#176b54]">
                    {facilities.length} facilities matched
                  </span>
                </div>
                <h3 className="mt-1 text-[15px] font-semibold tracking-[-.02em] text-[#23483e]">
                  {patient.snf.referralSentTo
                    ? `Referral sent to ${patient.snf.referralSentTo}`
                    : `${facilities[0].name} is the best equipped option`}
                </h3>
                <p className="mt-1 text-[10px] leading-relaxed text-[#71837d]">
                  {facilities[0].match}% clinical match · Bariatric and respiratory support · {facilities[0].availability} ·
                  Estimated patient cost {facilities[0].patientCost}
                </p>
              </div>
              <button
                onClick={() =>
                  document.getElementById("snf-recommendations")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#176b54] px-4 py-2.5 text-[10px] font-semibold text-white hover:bg-[#105b45]"
              >
                Compare facilities
                <Icon name="arrow" size={13} />
              </button>
            </div>
            <div className="grid grid-cols-3 border-t border-[#e2e9e6] bg-[#f8fbfa] lg:w-[390px] lg:border-l lg:border-t-0">
              {[
                ["Patient cost", facilities[0].patientCost, "14-day estimate", "text-[#29463f]"],
                ["Entry barrier", "24 hrs", "restraint-free", "text-[#a45440]"],
                ["Hospital delay", facilities[0].delayCost, "bed available", "text-[#176b54]"],
              ].map(([label, value, note, color], i) => (
                <div key={label} className={`flex flex-col justify-center px-4 py-3 ${i < 2 ? "border-r border-[#e2e9e6]" : ""}`}>
                  <p className="text-[8px] uppercase tracking-[.08em] text-[#8a9894]">{label}</p>
                  <p className={`mt-1 text-[14px] font-semibold ${color}`}>{value}</p>
                  <p className="text-[8px] text-[#8a9894]">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1fr_305px]">
        <div className="overflow-hidden rounded-[18px] border border-[#dbe4e1] bg-white">
          <div className="border-b border-[#e7ecea] px-5 pt-5 md:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-[16px] font-semibold tracking-[-.02em] text-[#1b4037]">Readiness checklist</h3>
                <p className="mt-0.5 text-[11px] text-[#82908d]">
                  {completed} of {tasks.length} tasks complete · Sorted by clinical priority
                </p>
              </div>
              <div className="relative">
                <Icon name="search" size={14} className="absolute left-3 top-2.5 text-[#8a9995]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks"
                  aria-label="Search tasks"
                  className="h-9 w-full rounded-lg border border-[#dce4e2] bg-[#fafcfb] pl-9 pr-3 text-[11px] outline-none transition focus:border-[#79aa9c] sm:w-44"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-5">
              {(["All tasks", "Open", "Completed"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`border-b-2 pb-3 text-[11px] font-semibold transition ${
                    filter === item ? "border-[#197158] text-[#176b54]" : "border-transparent text-[#8a9794] hover:text-[#536a64]"
                  }`}
                >
                  {item}
                  {item === "Open" && (
                    <span className="ml-1.5 rounded-full bg-[#ecf1ef] px-1.5 py-0.5 text-[9px]">{tasks.length - completed}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-[#edf1ef]">
            {filteredTasks.map((task) => (
              <TaskRow key={task.id} task={task} patient={patient} highlight={highlightId === task.id} />
            ))}
            {filteredTasks.length === 0 && (
              <div className="py-14 text-center text-sm text-[#81908c]">
                {tasks.length ? "No tasks match this view." : "No tasks yet. Generate a checklist from rounds notes."}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 border-t border-[#e7ecea]">
            <button
              onClick={() => setModal("generate")}
              className="flex items-center justify-center gap-2 border-r border-[#e7ecea] py-3.5 text-[11px] font-semibold text-[#197158] hover:bg-[#f4f8f6]"
            >
              <Icon name="sparkles" size={15} />
              Add from rounds notes
            </button>
            <button
              onClick={() => setModal("task")}
              className="flex items-center justify-center gap-2 py-3.5 text-[11px] font-semibold text-[#197158] hover:bg-[#f4f8f6]"
            >
              <Icon name="plus" size={15} />
              Add task manually
            </button>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[18px] border border-[#d8e5e1] bg-[#f7fbf9] p-5">
            <div className="flex items-center gap-2 text-[#176b54]">
              <Icon name="sparkles" size={17} />
              <h3 className="text-[12px] font-semibold">AI clinical summary</h3>
              <span className="ml-auto text-[9px] text-[#82938e]">
                {patient.roundedAt ? `Rounds ${patient.roundedAt}` : "Not rounded"}
              </span>
            </div>
            <SummaryPoints points={patient.summary} className="mt-4" />
            {patient.outlook && <p className="mt-3 text-[10px] font-semibold text-[#2f6b5a]">{patient.outlook}</p>}
            <div className="my-4 border-t border-[#dfe9e5]" />
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.09em] text-[#85938f]">A–G assessment</p>
            <AssessmentList assessment={patient.assessment} compact />
            <a
              href={`#/rounds/${patient.id}`}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#cfe1db] bg-white py-2.5 text-[11px] font-semibold text-[#176b54] hover:bg-[#edf6f2]"
            >
              <Icon name="document" size={14} />
              Review source data
            </a>
          </div>

          <div className="rounded-[18px] border border-[#dce5e2] bg-white p-5">
            <h3 className="text-[12px] font-semibold text-[#29463f]">Discharge plan</h3>
            <dl className="mt-3 space-y-2.5">
              {patient.plan.map((row) => (
                <div key={row.label} className="flex justify-between gap-3 text-[11px]">
                  <dt className="text-[#8a9894]">{row.label}</dt>
                  <dd className="text-right font-medium text-[#3d554f]">{row.value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-3 text-[11px]">
                <dt className="text-[#8a9894]">Coverage</dt>
                <dd className="text-right font-medium text-[#3d554f]">{patient.coverage}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[18px] border border-[#dce5e2] bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-semibold text-[#29463f]">Care team</h3>
              <button onClick={() => setModal("team")} className="text-[10px] font-semibold text-[#197158] hover:underline">
                View all
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {team.slice(0, 3).map((m) => (
                <div className="flex items-center gap-3" key={m.id}>
                  <div
                    className="grid h-8 w-8 place-items-center rounded-lg text-[9px] font-bold"
                    style={{ background: m.color, color: m.text }}
                  >
                    {m.initials}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#3d554f]">{m.name}</p>
                    <p className="text-[9px] text-[#8a9894]">{m.role}</p>
                  </div>
                  <span className={`ml-auto h-2 w-2 rounded-full ${m.online ? "bg-[#4ab18f]" : "bg-[#c6d0cd]"}`} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {patient.snf && (
        <section
          id="snf-recommendations"
          className="mt-5 scroll-mt-24 overflow-hidden rounded-[18px] border border-[#dbe4e1] bg-white"
        >
          <div className="flex flex-col gap-4 border-b border-[#e7ecea] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e3f0ec] text-[#176b54]">
                <Icon name="building" size={20} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[16px] font-semibold tracking-[-.02em] text-[#1b4037]">
                    Skilled nursing facility recommendations
                  </h3>
                  <span className="rounded-full bg-[#e7f2ee] px-2.5 py-1 text-[9px] font-semibold text-[#176b54]">
                    {facilities.length} matched
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7e8e89]">
                  Ranked by clinical capability, admission likelihood, insurance coverage, and total transition cost.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[#dce5e2] bg-[#f9fbfa] px-3.5 py-2.5">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[#567169] shadow-sm">
                <Icon name="shield" size={15} />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[.09em] text-[#879590]">Coverage</p>
                <p className="text-[11px] font-semibold text-[#365149]">{patient.coverage}</p>
              </div>
              <span className="ml-2 rounded-full bg-[#fff0d7] px-2 py-1 text-[9px] font-semibold text-[#936018]">
                Prior auth needed
              </span>
            </div>
          </div>

          <div className="grid border-b border-[#e7ecea] lg:grid-cols-[1fr_1.1fr]">
            <div className="border-b border-[#e7ecea] p-5 md:p-6 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#334f47]">Potential admission barriers</p>
                  <p className="mt-0.5 text-[10px] text-[#889691]">Identified from the chart and rounds transcript</p>
                </div>
                <span className="rounded-full bg-[#fde6df] px-2 py-1 text-[9px] font-bold text-[#aa4d3d]">
                  {patient.snf.barriers.filter((b) => b.level === "HIGH").length} high priority
                </span>
              </div>
              <div className="space-y-2.5">
                {patient.snf.barriers.map((b) => {
                  const tone =
                    b.level === "HIGH"
                      ? ["border-[#f0d5ce] bg-[#fff9f7]", "bg-[#fbe4de] text-[#b25040]", "text-[#5b403a]", "text-[#b14f3d]", "text-[#806b65]"]
                      : b.level === "MODERATE"
                        ? ["border-[#eadfc9] bg-[#fffcf5]", "bg-[#f8ecd3] text-[#99691f]", "text-[#594d38]", "text-[#97671e]", "text-[#7d7463]"]
                        : ["border-[#dce5e2] bg-[#fafcfb]", "bg-[#e8f0ed] text-[#547168]", "text-[#40564f]", "text-[#647b74]", "text-[#71817c]"]
                  return (
                    <div key={b.title} className={`flex items-start gap-3 rounded-xl border p-3 ${tone[0]}`}>
                      <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tone[1]}`}>
                        <Icon name={b.icon} size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-[11px] font-semibold ${tone[2]}`}>{b.title}</p>
                          <span className={`text-[9px] font-semibold ${tone[3]}`}>{b.level}</span>
                        </div>
                        <p className={`mt-1 text-[10px] leading-relaxed ${tone[4]}`}>{b.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-[#334f47]">Financial recommendation</p>
                  <p className="mt-0.5 text-[10px] text-[#889691]">Estimated 14-day episode under current benefits</p>
                </div>
                <Icon name="dollar" size={19} className="text-[#1b785e]" />
              </div>
              <div className="mt-4 rounded-xl bg-[#edf7f3] p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#197358] text-white">
                    <Icon name="sparkles" size={15} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#205c4c]">Best overall value: {facilities[0].name}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-[#5d786f]">
                      It costs the patient $140 more than Greenfield, but today’s bed availability avoids an estimated
                      $2,450 additional hospital day and offers the strongest respiratory and bariatric support.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Patient estimate", facility.patientCost, "$25/day copay"],
                  ["Payer estimate", facility.payerCost, "14-day allowed"],
                  ["Hospital transfer", facility.hospitalCost, "Transport est."],
                  ["Delay exposure", facility.delayCost, facility.delayCost === "$0" ? "Same-day placement" : "Extra hospital day"],
                ].map(([label, value, note], i) => (
                  <div
                    key={label}
                    className={`rounded-lg border p-3 ${i === 3 ? "border-[#cfe3dc] bg-[#f5fbf8]" : "border-[#e2e9e7]"}`}
                  >
                    <p className="text-[9px] text-[#84928e]">{label}</p>
                    <p className={`mt-1 text-[15px] font-semibold ${i === 3 ? "text-[#176b54]" : "text-[#2e4a43]"}`}>{value}</p>
                    <p className="text-[8px] text-[#96a19e]">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h4 className="text-[12px] font-semibold text-[#334f47]">Recommended facilities</h4>
                <p className="mt-0.5 text-[10px] text-[#889691]">Select a facility to review its fit and estimated costs.</p>
              </div>
              <p className="flex items-center gap-1.5 text-[9px] text-[#84928e]">
                <Icon name="clock" size={11} />
                Availability verified 12 minutes ago
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {facilities.map((f, index) => {
                const isSelected = selectedFacility === index
                return (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFacility(index)}
                    aria-pressed={isSelected}
                    className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#338a70] bg-[#f6fbf9] shadow-[0_4px_16px_rgba(30,93,74,.08)]"
                        : "border-[#dfe7e4] bg-white hover:border-[#aac8be]"
                    }`}
                  >
                    {index === 0 && (
                      <span className="absolute right-0 top-0 rounded-bl-xl bg-[#176b54] px-3 py-1.5 text-[8px] font-bold uppercase tracking-[.08em] text-white">
                        Recommended
                      </span>
                    )}
                    <div className="flex items-start gap-3 pr-12">
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                          isSelected ? "bg-[#dcefe8] text-[#176b54]" : "bg-[#edf2f0] text-[#60766f]"
                        }`}
                      >
                        <Icon name="building" size={17} />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#29463f]">{f.name}</p>
                        <p className="mt-0.5 text-[9px] text-[#869590]">
                          {f.distance} · {f.availability}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-[8px] uppercase tracking-[.08em] text-[#899792]">Clinical match</p>
                        <p className="mt-0.5 text-[20px] font-semibold tracking-tight text-[#21483d]">{f.match}%</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                          index === 0 ? "bg-[#def0e9] text-[#176b54]" : index === 1 ? "bg-[#e6edf8] text-[#4b6486]" : "bg-[#eef1f0] text-[#667873]"
                        }`}
                      >
                        {f.rank}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e7edeb]">
                      <div
                        className={`h-full rounded-full ${index === 0 ? "bg-[#25866a]" : "bg-[#86aa9f]"}`}
                        style={{ width: `${f.match}%` }}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {f.specialties.map((s) => (
                        <span key={s} className="rounded-md bg-white px-2 py-1 text-[8px] font-medium text-[#657a74] ring-1 ring-[#e0e7e5]">
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="my-4 border-t border-[#e5ebe9]" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[8px] text-[#899692]">Patient / 14 days</p>
                        <p className="mt-0.5 text-[13px] font-semibold text-[#354f48]">{f.patientCost}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-[#899692]">Payer / 14 days</p>
                        <p className="mt-0.5 text-[13px] font-semibold text-[#354f48]">{f.payerCost}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-4 space-y-2 rounded-xl border border-[#d9e8e3] bg-white p-3">
                        <p className="text-[9px] leading-relaxed text-[#60746e]">{f.note}</p>
                        <p className="flex items-start gap-1.5 text-[9px] font-medium text-[#a45b3f]">
                          <Icon name="alert" size={11} className="mt-0.5 shrink-0" />
                          {f.barrier}
                        </p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#e2e8e6] bg-[#fafcfb] px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex items-start gap-2 text-[9px] leading-relaxed text-[#7b8b87]">
                <Icon name="alert" size={12} className="mt-0.5 shrink-0" />
                Estimates are decision-support only and require benefits, authorization, bed, formulary, and clinical
                acceptance verification before placement.
              </div>
              <button
                onClick={() => {
                  dispatch({ type: "sendReferral", pid: patient.id, facility: facility.name })
                  notify(`Referral sent to ${facility.name} for ${patient.name}`)
                }}
                disabled={patient.snf.referralSentTo === facility.name}
                className="ml-auto flex shrink-0 items-center gap-2 rounded-lg bg-[#176b54] px-3.5 py-2 text-[10px] font-semibold text-white hover:bg-[#105b45] disabled:bg-[#8fb5a8]"
              >
                {patient.snf.referralSentTo === facility.name ? (
                  <>
                    <Icon name="check" size={12} /> Referral sent
                  </>
                ) : (
                  <>
                    Send referral to {facility.name.split(" ")[0]}
                    <Icon name="arrow" size={12} />
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {modal === "generate" && <GeneratorModal patient={patient} onClose={() => setModal(null)} />}
      {modal === "team" && <CareTeamModal patient={patient} onClose={() => setModal(null)} />}
      {modal === "task" && <AddTaskModal defaultPatientId={patient.id} onClose={() => setModal(null)} />}
    </>
  )
}
