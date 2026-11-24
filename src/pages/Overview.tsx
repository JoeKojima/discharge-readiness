import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { staff, type Patient, type Task } from "../data"
import { blocker, readiness, sortTasks, status } from "../logic"
import { navigate, useStore } from "../store"
import { TaskRow } from "../components/TaskRow"
import { AssessmentList, SummaryPoints } from "../components/ClinicalSummary"
import { ReadinessBreakdown } from "../components/ReadinessBreakdown"
import { AddTaskModal, CareTeamModal, GeneratorModal } from "../components/Modals"
import { EpicPanel } from "../components/EpicPanel"
import { Avatar, Icon, ProgressRing, StatusBadge, card, inputCls, primaryBtn, secondaryBtn, type IconName } from "../ui"
import {
  disciplineLabel,
  homeUnknown,
  socialItems,
  type Discipline,
  type HomeSituation,
  type TherapyNote,
} from "../careProfile"
import { familyStatus, statusTone, when, type Coordination, type Stream } from "../coordinator/engine"
import { payerFamily, payers, type Destination } from "../coordinator/directory"
import { defaultProfile } from "../coordinator/seeds"
import { tone } from "./Coordinator"

const facilityLevel = /SNF|skilled nursing|rehab|LTCH|long-term acute/i

/** My patients → one patient: a single card that reads top to bottom like the discharge conversation. */
export function Overview({ patient }: { patient: Patient }) {
  const [modal, setModal] = useState<null | "generate" | "team" | "task">(null)
  const [showWhy, setShowWhy] = useState(false)
  const ready = readiness(patient)
  const c = patient.coordination
  const destination: Destination = c?.profile.destination ?? defaultProfile(patient).destination
  const isFacility = facilityLevel.test(destination)

  return (
    <>
      <section className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#6e807b]">
            <a href="#/" className="hover:text-[#184f41]">Overview</a>
            <Icon name="chevron" size={12} />
            <span className="text-[#184f41]">My patients · {patient.name}</span>
          </div>
          <h2 className="text-[27px] font-semibold tracking-[-.04em] text-[#173b33]">Discharge command centre</h2>
          <p className="mt-1 text-[13px] text-[#70807c]">Rounds, rehab, insurance, home and the checklist on one card.</p>
        </div>
        <PatientSwitcher patient={patient} />
      </section>

      <article className={`${card} mx-auto max-w-[1040px] shadow-[0_2px_8px_rgba(30,65,55,.04)]`} aria-label={`${patient.name} discharge card`}>
        <header className="flex flex-wrap items-start gap-4 border-b border-[#e7ecea] px-5 py-5 md:px-6">
          <Avatar initials={patient.initials} color={patient.color} size={46} />
          <div className="min-w-0 flex-1 basis-[220px]">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[22px] font-semibold tracking-[-.03em] text-[#183d34]">{patient.name}</h3>
              <StatusBadge status={status(patient)} />
            </div>
            <p className="mt-1 text-[11px] text-[#758681]">
              {patient.age} {patient.sex} · {patient.room} · MRN {patient.mrn} · LOS {patient.los}d
            </p>
            <p className="mt-0.5 text-[11px] text-[#5d7570]">
              {patient.diagnosis} · going to <b className="font-semibold">{destination}</b> · target {patient.target}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              aria-controls="readiness-breakdown"
              className="flex items-center gap-2 rounded-xl px-1 text-left hover:bg-[#f4f8f6]"
              title="How readiness is calculated"
            >
              <ProgressRing value={ready} size={64} />
              <span className="text-[10px] font-semibold leading-tight text-[#176b54]">
                {showWhy ? "Hide" : "How is"}
                <br />
                {showWhy ? "breakdown" : `${ready}% worked out?`}
              </span>
            </button>
            <PatientMenu patient={patient} onModal={setModal} />
          </div>
        </header>

        {showWhy && (
          <div id="readiness-breakdown" className="border-b border-[#e7ecea] p-4 md:px-6">
            <ReadinessBreakdown patient={patient} />
          </div>
        )}

        <Section title="Round summary" icon="stethoscope" aside={<RoundsChip patient={patient} />}>
          <div className="grid gap-3 lg:grid-cols-3">
            <PhysicianBox patient={patient} />
            <TherapyBox patient={patient} d="pt" />
            <TherapyBox patient={patient} d="ot" />
          </div>
        </Section>

        <Section title={isFacility ? "Rehab tracker" : "Discharge tracker"} icon="building" aside={<AutomationChip c={c} />}>
          <Tracker patient={patient} c={c} isFacility={isFacility} />
        </Section>

        <Section title="Insurance" icon="shield">
          <Insurance patient={patient} c={c} destination={destination} isFacility={isFacility} />
        </Section>

        <Section title="Home situation" icon="home">
          <Home patient={patient} />
        </Section>

        <Section title="Social work" icon="user" aside={<SocialCount patient={patient} />}>
          <Social patient={patient} />
        </Section>

        <Section title="Checklist" icon="check">
          <Checklist patient={patient} onModal={setModal} />
        </Section>
      </article>

      <div className="mx-auto mt-5 max-w-[1040px]">
        <EpicPanel patient={patient} />
      </div>

      {modal === "generate" && <GeneratorModal patient={patient} onClose={() => setModal(null)} />}
      {modal === "team" && <CareTeamModal patient={patient} onClose={() => setModal(null)} />}
      {modal === "task" && <AddTaskModal defaultPatientId={patient.id} onClose={() => setModal(null)} />}
    </>
  )
}

// ---- Layout pieces ---------------------------------------------------------------

function Section({ title, icon, aside, children }: { title: string; icon: IconName; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="border-b border-[#edf1ef] px-5 py-5 last:border-b-0 md:px-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e3f0ec] text-[#176b54]">
          <Icon name={icon} size={14} />
        </span>
        <h4 className="text-[14px] font-semibold tracking-[-.01em] text-[#1b4037]">{title}</h4>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

function Pill({ kind, children }: { kind: keyof typeof tone; children: ReactNode }) {
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold ${tone[kind]}`}>{children}</span>
}

function useOutsideClose(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, close])
  return ref
}

function PatientSwitcher({ patient }: { patient: Patient }) {
  const { state } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useOutsideClose(open, () => setOpen(false))
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
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
      {open && (
        <div role="listbox" className="absolute right-0 top-[54px] z-30 max-h-[420px] w-[290px] overflow-y-auto rounded-2xl border border-[#dce5e2] bg-white p-2 shadow-xl">
          {state.patients.map((p) => (
            <button
              key={p.id}
              role="option"
              aria-selected={p.id === patient.id}
              onClick={() => {
                setOpen(false)
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
        </div>
      )}
    </div>
  )
}

// ---- ☰ menu: automation status and rounds status --------------------------------

const automationLabel = { waiting: "Running", done: "Done", escalated: "Handed to JMO list" } as const
const automationTone = { waiting: "progress", done: "good", escalated: "warn" } as const

function therapyStatus(n: TherapyNote | undefined): [string, keyof typeof tone] {
  if (!n || n.status === "not-referred") return ["Not referred", "neutral"]
  if (n.status === "pending") return ["Pending", "warn"]
  return [`Seen ${n.at}`, "good"]
}

function PatientMenu({ patient, onModal }: { patient: Patient; onModal: (m: "generate" | "team" | "task") => void }) {
  const { dispatch, notify } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useOutsideClose(open, () => setOpen(false))
  const c = patient.coordination
  const automations = patient.tasks.filter((t) => t.automation)
  const gates = c?.gates.filter((g) => !g.resolved).length ?? 0
  const attention = gates > 0 || automations.some((t) => t.automation?.state === "escalated")
  const openTasks = patient.tasks.filter((t) => !t.completed).length
  const pick = (m: "generate" | "team" | "task") => {
    setOpen(false)
    onModal(m)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Automation and rounds status"
        className="relative grid h-11 w-11 place-items-center rounded-full border border-[#d9e3e0] bg-white text-[#365149] shadow-sm hover:border-[#b9ccc6]"
      >
        <Icon name="menu" size={18} />
        {attention && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#d9a24a]" />}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Automation and rounds status"
          className="fixed inset-x-4 top-20 z-40 max-h-[calc(100vh-100px)] overflow-y-auto rounded-2xl border border-[#dce5e2] bg-white p-4 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-[52px] sm:max-h-none sm:w-[330px]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[.09em] text-[#85938f]">Automation status</p>
          <div className="mt-2 rounded-xl border border-[#e2e9e6] p-3">
            <div className="flex items-center gap-2">
              <Icon name="bolt" size={13} className="text-[#176b54]" />
              <p className="flex-1 text-[11px] font-semibold text-[#29463f]">Discharge coordinator</p>
              {c ? <Pill kind={c.ready ? "good" : "progress"}>{c.ready ? "Lined up" : "Running"}</Pill> : <Pill kind="neutral">Not started</Pill>}
            </div>
            <p className="mt-1 text-[10px] text-[#6c807a]">
              {c ? (c.ready ? "Everything is lined up." : familyStatus(c).replace(/^./, (x) => x.toUpperCase())) : "Automated referral hasn't been started."}
              {gates > 0 && <span className="font-semibold text-[#936018]"> {gates} need you.</span>}
            </p>
            <a href={`#/coordinator/${patient.id}`} className="mt-1.5 inline-block text-[10px] font-semibold text-[#176b54] hover:underline">
              {c ? "Open coordinator" : "Start automated referral"} →
            </a>
          </div>
          <ul className="mt-2 space-y-1.5">
            {automations.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-[11px] text-[#3d554f]">
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <Pill kind={automationTone[t.automation!.state]}>{automationLabel[t.automation!.state]}</Pill>
              </li>
            ))}
            {automations.length === 0 && <li className="text-[10px] text-[#8a9894]">No task automations running. Start one from a task on the Tasks board.</li>}
          </ul>

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.09em] text-[#85938f]">Rounds</p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-center gap-2 text-[11px] text-[#3d554f]">
              <span className="flex-1">Physician</span>
              {patient.roundedAt ? <Pill kind="good">Rounded {patient.roundedAt}</Pill> : <Pill kind="warn">Pending</Pill>}
            </li>
            {(["pt", "ot"] as Discipline[]).map((d) => {
              const [label, kind] = therapyStatus(patient.therapy?.[d])
              return (
                <li key={d} className="flex items-center gap-2 text-[11px] text-[#3d554f]">
                  <span className="flex-1">{disciplineLabel[d]}</span>
                  <Pill kind={kind}>{label}</Pill>
                </li>
              )
            })}
          </ul>
          <a href={`#/rounds/${patient.id}`} className="mt-2 inline-block text-[10px] font-semibold text-[#176b54] hover:underline">
            Open rounds →
          </a>

          <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-[#edf1ef] pt-3">
            <button onClick={() => pick("team")} className="rounded-lg px-2 py-2 text-[10px] font-semibold text-[#176b54] hover:bg-[#f0f5f3]">
              Care team
            </button>
            <button onClick={() => pick("generate")} className="rounded-lg px-2 py-2 text-[10px] font-semibold text-[#176b54] hover:bg-[#f0f5f3]">
              Re-run checklist
            </button>
            <button onClick={() => pick("task")} className="rounded-lg px-2 py-2 text-[10px] font-semibold text-[#176b54] hover:bg-[#f0f5f3]">
              Add task
            </button>
          </div>
          {patient.tasks.length > 0 && openTasks === 0 && (
            <button
              onClick={() => {
                dispatch({ type: "dischargePatient", pid: patient.id })
                notify(`${patient.name} discharged and removed from your list`)
                navigate("/")
              }}
              className={`${primaryBtn} mt-2 w-full justify-center`}
            >
              Discharge patient
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function RoundsChip({ patient }: { patient: Patient }) {
  const pending = [!patient.roundedAt, ...(["pt", "ot"] as Discipline[]).map((d) => patient.therapy?.[d]?.status === "pending")].filter(Boolean).length
  return pending ? <Pill kind="warn">{pending} pending</Pill> : <Pill kind="good">All seen</Pill>
}

function AutomationChip({ c }: { c?: Coordination }) {
  if (!c) return <Pill kind="neutral">Not automated yet</Pill>
  const gates = c.gates.filter((g) => !g.resolved).length
  if (gates) return <Pill kind="warn">{gates} need you</Pill>
  return c.ready ? <Pill kind="good">Lined up</Pill> : <Pill kind="progress">Automated referral running</Pill>
}

// ---- Round summary ---------------------------------------------------------------

function Box({ title, by, status, children }: { title: string; by: string; status: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border border-[#e2e9e6] bg-[#fbfdfc] p-4" aria-label={`${title} round summary`} role="group">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-[#29463f]">{title}</p>
          <p className="text-[10px] text-[#8a9894]">{by}</p>
        </div>
        {status}
      </div>
      <div className="mt-3 flex-1">{children}</div>
    </div>
  )
}

function PhysicianBox({ patient }: { patient: Patient }) {
  const doctor = staff.find((s) => s.role === "Attending" && patient.careTeam.includes(s.id))?.name ?? "Attending"
  return (
    <Box
      title="Physician"
      by={doctor}
      status={patient.roundedAt ? <Pill kind="good">Rounded {patient.roundedAt}</Pill> : <Pill kind="warn">Not rounded today</Pill>}
    >
      <SummaryPoints points={patient.summary} />
      {patient.outlook && <p className="mt-2 text-[10px] font-semibold text-[#2f6b5a]">{patient.outlook}</p>}
      <details className="mt-3">
        <summary className="cursor-pointer text-[10px] font-semibold text-[#176b54]">A–G assessment</summary>
        <div className="mt-2">
          <AssessmentList assessment={patient.assessment} compact />
        </div>
      </details>
    </Box>
  )
}

function TherapyBox({ patient, d }: { patient: Patient; d: Discipline }) {
  const { dispatch, notify } = useStore()
  const n = patient.therapy?.[d] ?? { status: "not-referred" as const }
  const label = d === "pt" ? "PT" : "OT"
  const owner = disciplineLabel[d]
  const referral = patient.tasks.find((t) => t.owner === owner && /evaluation/i.test(t.title) && !t.completed)
  const [statusLabel, kind] = therapyStatus(n)
  const who = n.status === "seen" ? n.by : (staff.find((s) => s.role === owner)?.name ?? owner)

  return (
    <Box title={label} by={`${owner} · ${who}`} status={<Pill kind={kind}>{statusLabel}</Pill>}>
      {n.status === "seen" && (
        <>
          <ul className="space-y-1.5">
            {n.points.map((pt) => (
              <li key={pt} className="flex gap-2 text-[11px] leading-snug text-[#3d554f]">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#5d9c88]" />
                {pt}
              </li>
            ))}
          </ul>
          <p className="mt-2 rounded-lg bg-[#edf7f3] px-2.5 py-1.5 text-[10px] text-[#205c4c]">
            <b>Recommends:</b> {n.recommendation}
          </p>
        </>
      )}
      {n.status === "pending" && <p className="text-[11px] text-[#6b5524]">{n.note}</p>}
      {n.status === "not-referred" && (
        <div>
          <p className="text-[11px] text-[#8a9894]">No {label} referral for this admission.</p>
          <button
            disabled={!!referral}
            onClick={() => {
              const task: Task = {
                id: `${patient.id}-${d}-${Date.now()}`,
                title: `${label} evaluation`,
                detail: `${owner} to assess function and recommend a discharge destination.`,
                owner,
                due: "Due today",
                urgency: "Medium",
                effort: "30 min",
                category: "Clinical",
                completed: false,
              }
              dispatch({ type: "addTasks", pid: patient.id, tasks: [task] })
              notify(`${label} evaluation added to ${patient.name}'s checklist`)
            }}
            className="mt-2 text-[10px] font-semibold text-[#176b54] hover:underline disabled:text-[#8a9894] disabled:no-underline"
          >
            {referral ? `${label} evaluation on the checklist` : `Refer to ${label}`}
          </button>
        </div>
      )}
    </Box>
  )
}

// ---- Rehab / discharge tracker -----------------------------------------------------

const done = (s?: Stream, ok: string[] = ["confirmed", "approved", "booked", "not-needed"]) => !!s && ok.includes(s.status)

function Tracker({ patient, c, isFacility }: { patient: Patient; c?: Coordination; isFacility: boolean }) {
  if (!c)
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[#cfdcd7] bg-[#fafcfb] p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-[#29463f]">No automated referral yet</p>
          <p className="mt-0.5 text-[11px] text-[#6c807a]">
            The coordinator can match {isFacility ? "facilities, send referrals to all of them at once and chase replies" : "equipment, home health and a ride"},
            then book insurance and transport. Every step is simulated.
          </p>
        </div>
        <a href={`#/coordinator/${patient.id}`} className={`${primaryBtn} justify-center`}>
          <Icon name="bolt" size={13} /> Start automated referral
        </a>
      </div>
    )

  const facilities = c.streams.filter((s) => s.kind === "facility").sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
  const homeStreams = c.streams.filter((s) => ["dme", "homehealth", "infusion", "dialysis"].includes(s.kind))
  const dialysis = c.streams.find((s) => s.kind === "dialysis")
  const auth = c.streams.find((s) => s.kind === "auth")
  const ride = c.streams.find((s) => s.kind === "transport")
  const gates = c.gates.filter((g) => !g.resolved)
  const steps: [string, boolean][] = isFacility
    ? [
        ["Referrals sent", facilities.some((s) => s.status !== "queued")],
        ["Accepted", facilities.some((s) => ["accepted", "confirmed"].includes(s.status))],
        ["Bed confirmed", facilities.some((s) => s.status === "confirmed")],
        ...(dialysis ? [["Dialysis chair", done(dialysis)] as [string, boolean]] : []),
        ["Insurance", done(auth)],
        ["Ride booked", done(ride)],
        ["Ready", c.ready],
      ]
    : [
        ...homeStreams.map((s): [string, boolean] => [s.label, done(s)]),
        ["Insurance", done(auth)],
        ["Ride booked", done(ride)],
        ["Ready", c.ready],
      ]
  const list = isFacility ? facilities : homeStreams

  return (
    <div>
      <ol className="flex flex-wrap gap-1.5" aria-label="Tracker steps">
        {steps.map(([label, ok]) => (
          <li
            key={label}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
              ok ? "border-[#cfe3dc] bg-[#f0f8f5] text-[#176b54]" : "border-[#e2e9e6] bg-white text-[#7a8b86]"
            }`}
          >
            <span className={`grid h-3.5 w-3.5 place-items-center rounded-full ${ok ? "bg-[#25866a] text-white" : "border border-[#c3d0cc]"}`}>
              {ok && <Icon name="check" size={9} />}
            </span>
            {label}
          </li>
        ))}
      </ol>
      {gates.length > 0 && (
        <a
          href={`#/coordinator/${patient.id}`}
          className="mt-3 flex items-center gap-2 rounded-xl border border-[#f0dcb5] bg-[#fffbf3] px-3 py-2 text-[11px] font-semibold text-[#6b4d12]"
        >
          <Icon name="flag" size={13} /> {gates.map((g) => g.title).join(" · ")}
          <span className="ml-auto whitespace-nowrap">Review →</span>
        </a>
      )}
      <ul className="mt-3 divide-y divide-[#f0f3f2] rounded-xl border border-[#e2e9e6]">
        {list.slice(0, 4).map((s) => (
          <li key={s.id} className="flex items-start gap-3 px-3 py-2.5">
            {s.rank !== undefined && (
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#eef2f0] text-[9px] font-bold text-[#5d7570]">{s.rank}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#29463f]">{s.party}</p>
              <p className="truncate text-[10px] text-[#6c807a]" title={s.note}>
                {s.note}
              </p>
            </div>
            <Pill kind={statusTone[s.status]}>{s.status.replace("-", " ")}</Pill>
          </li>
        ))}
        {list.length === 0 && <li className="px-3 py-2.5 text-[11px] text-[#8a9894]">Waiting for the referral packet to be approved.</li>}
      </ul>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#8a9894]">
        <span>
          {c.admission ? `Discharge ${when(c.admission.at)} to ${c.admission.party}` : `${list.length > 4 ? `+${list.length - 4} more · ` : ""}simulated outreach`}
        </span>
        <a href={`#/coordinator/${patient.id}`} className="font-semibold text-[#176b54] hover:underline">
          Open coordinator board →
        </a>
      </div>
    </div>
  )
}

// ---- Insurance -------------------------------------------------------------------

function Insurance({ patient, c, destination, isFacility }: { patient: Patient; c?: Coordination; destination: Destination; isFacility: boolean }) {
  const payer = payers[payerFamily(patient.coverage)]
  const auth = c?.streams.find((s) => s.kind === "auth")
  const extension = c?.streams.find((s) => s.kind === "extension")
  const needed = payer.needsAuth(destination)
  const rows: [string, ReactNode][] = [
    ["Plan", patient.coverage],
    [
      "Prior authorisation",
      auth ? (
        <span className="flex flex-wrap items-center justify-end gap-1.5">
          <Pill kind={statusTone[auth.status]}>{auth.status.replace("-", " ")}</Pill>
          <span>{auth.note}</span>
        </span>
      ) : needed ? (
        <span className="flex flex-wrap items-center justify-end gap-1.5">
          <Pill kind="warn">Needed</Pill>
          <span>{isFacility ? "Sent once a facility accepts" : "Not submitted yet"}</span>
        </span>
      ) : (
        <span>Not needed for {destination.toLowerCase()}</span>
      ),
    ],
    ...(extension
      ? ([
          [
            "Weekly extension",
            <span className="flex flex-wrap items-center justify-end gap-1.5">
              <Pill kind={statusTone[extension.status]}>{extension.status.replace("-", " ")}</Pill>
              <span>{extension.note}</span>
            </span>,
          ],
        ] as [string, ReactNode][])
      : []),
    ["Where it's submitted", payer.portal],
    ["Typical turnaround", payer.turnaroundHours ? `About ${payer.turnaroundHours} hours` : "No wait"],
  ]
  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-3 rounded-lg bg-[#fafcfb] px-3 py-2 text-[11px]">
          <dt className="shrink-0 text-[#8a9894]">{label}</dt>
          <dd className="text-right font-medium text-[#3d554f]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// ---- Home situation ----------------------------------------------------------------

const homeFields: [keyof HomeSituation, string, string][] = [
  ["address", "Address", "Street, city, zip"],
  ["dwelling", "Home", "e.g. second-floor apartment, 14 stairs, no lift"],
  ["support", "Support", "Lives alone, or who can help after discharge"],
]
const askTitle = "Ask about home situation"

function Home({ patient }: { patient: Patient }) {
  const { dispatch, notify } = useStore()
  const home = patient.home ?? { address: "", dwelling: "", support: "" }
  const unknown = homeUnknown(home)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(home)
  const asked = patient.tasks.find((t) => t.title === askTitle && !t.completed)
  const sw = staff.find((s) => s.role === "Social work")

  return (
    <div>
      {unknown && !editing && (
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-[#f0dcb5] bg-[#fffbf3] p-3 sm:flex-row sm:items-center" role="status">
          <Icon name="alert" size={16} className="shrink-0 text-[#b07a1f]" />
          <p className="flex-1 text-[11px] text-[#6b4d12]">
            <b>Still need someone to ask about their home situation.</b> Missing:{" "}
            {homeFields
              .filter(([k]) => !home[k].trim())
              .map(([, label]) => label.toLowerCase())
              .join(", ")}
            .
          </p>
          <button
            disabled={!!asked}
            onClick={() => {
              const task: Task = {
                id: `${patient.id}-home-${Date.now()}`,
                title: askTitle,
                detail: "Confirm address, type of home (stairs, lift, bathroom access) and who can help after discharge.",
                owner: "Social Work",
                due: "Due today",
                urgency: "High",
                effort: "20 min",
                category: "Coordination",
                completed: false,
              }
              dispatch({ type: "addTasks", pid: patient.id, tasks: [task] })
              notify(`Asked ${sw?.name ?? "social work"} to talk with ${patient.name} about home`)
            }}
            className={`${secondaryBtn} justify-center disabled:opacity-50`}
          >
            {asked ? "Social work asked" : "Ask social work"}
          </button>
        </div>
      )}

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            dispatch({ type: "setHome", pid: patient.id, home: { address: form.address.trim(), dwelling: form.dwelling.trim(), support: form.support.trim() } })
            setEditing(false)
            notify("Home situation saved")
          }}
          className="grid gap-2 sm:grid-cols-3"
        >
          {homeFields.map(([k, label, ph]) => (
            <label key={k} className="text-[10px] font-semibold text-[#385149]">
              {label}
              <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={ph} className={`${inputCls} mt-1`} />
            </label>
          ))}
          <div className="flex gap-2 sm:col-span-3">
            <button type="submit" className={primaryBtn}>
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className={secondaryBtn}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <dl className="grid flex-1 gap-2 sm:grid-cols-3">
            {homeFields.map(([k, label]) => (
              <div key={k} className="rounded-lg bg-[#fafcfb] px-3 py-2">
                <dt className="text-[9px] font-semibold uppercase tracking-[.08em] text-[#8a9894]">{label}</dt>
                <dd className={`mt-0.5 text-[11px] ${home[k].trim() ? "font-medium text-[#3d554f]" : "italic text-[#b07a1f]"}`}>
                  {home[k].trim() || "Not asked yet"}
                </dd>
              </div>
            ))}
          </dl>
          <button
            onClick={() => {
              setForm(home)
              setEditing(true)
            }}
            className="self-start text-[10px] font-semibold text-[#176b54] hover:underline"
          >
            {unknown ? "Record answers" : "Edit"}
          </button>
        </div>
      )}
    </div>
  )
}

// ---- Social work ---------------------------------------------------------------------

function SocialCount({ patient }: { patient: Patient }) {
  const s = patient.social ?? {}
  const relevant = socialItems.filter((i) => s[i.key] !== "na")
  const doneCount = relevant.filter((i) => s[i.key] === "done").length
  return <Pill kind={doneCount === relevant.length ? "good" : "neutral"}>{`${doneCount} of ${relevant.length} done`}</Pill>
}

function Social({ patient }: { patient: Patient }) {
  const { dispatch } = useStore()
  const s = patient.social ?? {}
  const sw = staff.find((x) => x.role === "Social work" && patient.careTeam.includes(x.id))
  return (
    <div>
      <p className="mb-2 text-[10px] text-[#8a9894]">{sw ? `${sw.name}, social work` : "No social worker on the care team yet"}</p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {socialItems.map((item) => {
          const v = s[item.key]
          return (
            <li key={item.key} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 ${v === "done" ? "border-[#cfe3dc] bg-[#f5fbf8]" : "border-[#e8eeec] bg-white"}`}>
              <button
                role="checkbox"
                aria-checked={v === "done"}
                aria-label={item.label}
                disabled={v === "na"}
                onClick={() => dispatch({ type: "setSocial", pid: patient.id, key: item.key, value: v === "done" ? undefined : "done" })}
                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${v === "done" ? "border-[#25866a] bg-[#25866a] text-white" : "border-[#b9c7c3] bg-white"} disabled:opacity-40`}
              >
                {v === "done" && <Icon name="check" size={10} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-medium ${v === "na" ? "text-[#a0aca9] line-through" : "text-[#3d554f]"}`}>{item.label}</p>
                <p className="text-[9px] text-[#8a9894]">{item.hint}</p>
              </div>
              <button
                onClick={() => dispatch({ type: "setSocial", pid: patient.id, key: item.key, value: v === "na" ? undefined : "na" })}
                className="shrink-0 text-[9px] font-semibold text-[#7a8b86] hover:text-[#176b54]"
              >
                {v === "na" ? "Needed" : "N/A"}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ---- Checklist ---------------------------------------------------------------------------

function Checklist({ patient, onModal }: { patient: Patient; onModal: (m: "generate" | "task") => void }) {
  const [filter, setFilter] = useState<"Open" | "Completed" | "All">("Open")
  const tasks = patient.tasks
  const open = tasks.filter((t) => !t.completed).length
  const block = blocker(patient)
  const shown = useMemo(
    () => sortTasks(tasks).filter((t) => filter === "All" || (filter === "Completed" ? t.completed : !t.completed)),
    [tasks, filter],
  )
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-2">
        {(["Open", "Completed", "All"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`border-b-2 pb-1.5 text-[11px] font-semibold ${filter === f ? "border-[#197158] text-[#176b54]" : "border-transparent text-[#8a9794]"}`}
          >
            {f}
            {f === "Open" && <span className="ml-1.5 rounded-full bg-[#ecf1ef] px-1.5 py-0.5 text-[9px]">{open}</span>}
          </button>
        ))}
        {block && (
          <p className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-[#ae4d3d]">
            <Icon name="alert" size={12} /> Blocker: {block.title}
          </p>
        )}
      </div>
      <div className="-mx-5 divide-y divide-[#edf1ef] border-y border-[#edf1ef] md:-mx-6">
        {shown.map((t) => (
          <TaskRow key={t.id} task={t} patient={patient} />
        ))}
        {shown.length === 0 && (
          <p className="py-8 text-center text-[11px] text-[#81908c]">{tasks.length ? "Nothing in this view." : "No tasks yet. Generate a checklist from rounds."}</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => onModal("generate")} className={secondaryBtn}>
          <Icon name="sparkles" size={13} /> Add from rounds notes
        </button>
        <button onClick={() => onModal("task")} className={secondaryBtn}>
          <Icon name="plus" size={13} /> Add task
        </button>
      </div>
    </div>
  )
}
