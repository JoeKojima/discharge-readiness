import { useEffect, useMemo, useState, type ReactNode } from "react"
import type { Patient } from "../data"
import {
  advance,
  approveAppeal,
  approvePacket,
  familyStatus,
  nextEventAt,
  resolveGate,
  sendWithoutFamily,
  startCoordination,
  statusTone,
  when,
  type Channel,
  type Coordination,
  type Profile,
  type Stream,
} from "../coordinator/engine"
import { destinations, facilityDirectory, needs as allNeeds, type Need } from "../coordinator/directory"
import { defaultProfile } from "../coordinator/seeds"
import { navigate, useStore } from "../store"
import { Avatar, Icon, PageHeader, card, inputCls, labelCls, primaryBtn, secondaryBtn, type IconName } from "../ui"
import { EpicPanel } from "../components/EpicPanel"

const HOUR = 3_600_000
const clock = (ms: number) => new Date(ms).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })

const tone = {
  neutral: "bg-[#eef2f0] text-[#5d7570]",
  progress: "bg-[#e6eef9] text-[#3f5f86]",
  warn: "bg-[#fff0d7] text-[#936018]",
  good: "bg-[#dcefe8] text-[#176b54]",
  bad: "bg-[#fde7e1] text-[#a6432f]",
}
const channelIcon: Record<Channel, IconName> = {
  fax: "document",
  email: "send",
  phone: "message",
  portal: "shield",
  text: "message",
  system: "bolt",
}
const actorTone = {
  agent: "text-[#176b54]",
  outside: "text-[#3f5f86]",
  staff: "text-[#7a5414]",
  family: "text-[#7d3b5b]",
}

function SimNotice() {
  return (
    <p className="mb-5 flex items-start gap-2 rounded-xl border border-[#e2e9e6] bg-[#fafcfb] px-4 py-3 text-[11px] leading-relaxed text-[#5d7570]">
      <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-[#176b54]" />
      Outreach is simulated in this demo: no faxes, calls, texts, emails or payer-portal submissions are sent. Facilities, payers,
      vendors and families answer according to the coordinator's directory, on a simulated clock you control. Use synthetic data only.
    </p>
  )
}

// ---- Unit view -----------------------------------------------------------------

export function Coordinator({ patientId }: { patientId?: string }) {
  const { state } = useStore()
  const patient = patientId ? state.patients.find((p) => p.id === patientId) : undefined
  if (patient) return <Board key={patient.id} patient={patient} />

  return (
    <>
      <PageHeader
        crumb="Coordinator"
        title="Discharge coordinator"
        subtitle="The outside-Epic legwork (facilities, insurers, equipment, home health, rides and family) run in parallel for every patient."
      />
      <SimNotice />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {state.patients.map((p) => {
          const c = p.coordination
          const gates = c?.gates.filter((g) => !g.resolved) ?? []
          const work = c?.streams.filter((s) => s.kind !== "family") ?? []
          const done = work.filter((s) => ["confirmed", "approved", "booked", "not-needed", "cancelled", "declined"].includes(s.status)).length
          return (
            <a key={p.id} href={`#/coordinator/${p.id}`} className={`${card} block p-4 transition hover:border-[#b9ccc6]`}>
              <div className="flex items-center gap-3">
                <Avatar initials={p.initials} color={p.color} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#29463f]">{p.name}</p>
                  <p className="truncate text-[10px] text-[#82918d]">{c ? `${c.profile.destination} · ${c.profile.coverage}` : p.disposition}</p>
                </div>
                {gates.length > 0 && (
                  <span className="rounded-full bg-[#fff0d7] px-2 py-0.5 text-[10px] font-semibold text-[#936018]">{gates.length} need you</span>
                )}
              </div>
              {c ? (
                <>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e7edeb]">
                    <div className="h-full rounded-full bg-[#25866a]" style={{ width: `${work.length ? (done / work.length) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] text-[#5d7570]">{c.ready ? "Everything is lined up" : familyStatus(c).replace(/^./, (x) => x.toUpperCase())}</p>
                </>
              ) : (
                <p className="mt-3 text-[11px] font-semibold text-[#176b54]">Set up coordination →</p>
              )}
            </a>
          )
        })}
      </section>
    </>
  )
}

// ---- Per-patient board ---------------------------------------------------------

function Board({ patient }: { patient: Patient }) {
  const { dispatch } = useStore()
  const c = patient.coordination
  const [playing, setPlaying] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)
  const set = (next: Coordination | undefined) => dispatch({ type: "coordSet", pid: patient.id, coordination: next })

  useEffect(() => {
    if (!playing || !c) return
    const id = window.setInterval(() => set(advance(c, c.now + HOUR)), 1200)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, c])
  useEffect(() => {
    if (c?.ready) setPlaying(false)
  }, [c?.ready])

  if (!c) return <Setup patient={patient} onStart={(profile) => set(startCoordination(patient, profile, Date.now()))} />

  const gates = c.gates.filter((g) => !g.resolved)
  const next = nextEventAt(c)
  const facilities = c.streams.filter((s) => s.kind === "facility").sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
  const home = c.streams.filter((s) => ["dme", "homehealth", "infusion"].includes(s.kind))
  const auth = c.streams.filter((s) => s.kind === "auth")
  const ride = c.streams.filter((s) => s.kind === "transport")
  const family = c.streams.filter((s) => s.kind === "family")
  const entries = [...c.log].reverse().filter((l) => !filter || l.streamId === filter)

  return (
    <>
      <section className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#6e807b]">
            <a href="#/coordinator" className="hover:text-[#184f41]">Coordinator</a>
            <Icon name="chevron" size={12} />
            <span className="text-[#184f41]">{patient.name}</span>
          </div>
          <h2 className="text-[27px] font-semibold tracking-[-.04em] text-[#173b33]">{patient.name}</h2>
          <p className="mt-1 text-[12px] text-[#70807c]">
            {c.profile.destination} · {c.profile.coverage}
            {c.profile.needs.length ? ` · needs ${c.profile.needs.join(", ")}` : ""} · {c.profile.family.name} ({c.profile.family.relation})
          </p>
        </div>
        <div className={`${card} flex flex-wrap items-center gap-2 p-2.5`} aria-label="Simulated clock">
          <div className="px-2">
            <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-[#8a9894]">Simulated time</p>
            <p className="text-[13px] font-semibold text-[#29463f]">{clock(c.now)}</p>
          </div>
          <button onClick={() => set(advance(c, c.now + HOUR))} className={secondaryBtn}>
            +1 h
          </button>
          <button onClick={() => set(advance(c, c.now + 4 * HOUR))} className={secondaryBtn}>
            +4 h
          </button>
          <button disabled={!Number.isFinite(next)} onClick={() => set(advance(c, next))} className={`${secondaryBtn} disabled:opacity-40`}>
            Next event
          </button>
          <button onClick={() => setPlaying((v) => !v)} disabled={c.ready} className={`${primaryBtn} disabled:opacity-40`}>
            <Icon name={playing ? "stop" : "arrow"} size={13} />
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </section>

      <SimNotice />

      {gates.length > 0 && (
        <section className="mb-5 rounded-[18px] border border-[#f0dcb5] bg-[#fffbf3] p-5" aria-label="Needs you">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[#6b4d12]">
            <Icon name="flag" size={14} /> Needs you ({gates.length})
          </h3>
          <div className="mt-3 space-y-3">
            {gates.map((g) => (
              <GateCard key={g.id} c={c} gateId={g.id} onChange={set} />
            ))}
          </div>
        </section>
      )}

      <Readiness c={c} />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          {(facilities.length > 0 || c.matches.length > 0) && (
            <Group title="Placement" subtitle="Referrals go to every chosen facility at once; denials auto-advance to the next match.">
              {facilities.map((s) => (
                <StreamCard key={s.id} s={s} active={filter === s.id} onClick={() => setFilter(filter === s.id ? null : s.id)} />
              ))}
              <Matches c={c} />
            </Group>
          )}
          {home.length > 0 && (
            <Group title="Home services" subtitle="Agencies are contacted in parallel; the first to accept wins.">
              {home.map((s) => (
                <StreamCard key={s.id} s={s} active={filter === s.id} onClick={() => setFilter(filter === s.id ? null : s.id)} />
              ))}
            </Group>
          )}
          {auth.length > 0 && (
            <Group title="Insurance" subtitle="Payer-portal submission with deadline tracking.">
              {auth.map((s) => (
                <StreamCard key={s.id} s={s} active={filter === s.id} onClick={() => setFilter(filter === s.id ? null : s.id)} />
              ))}
            </Group>
          )}
          {ride.length > 0 && (
            <Group title="Ride" subtitle="Booked once the destination and insurance are settled.">
              {ride.map((s) => (
                <StreamCard key={s.id} s={s} active={filter === s.id} onClick={() => setFilter(filter === s.id ? null : s.id)} />
              ))}
            </Group>
          )}
          <Group title="Family" subtitle="Contact check, facility choices and status texts; distress goes to a person.">
            {family.map((s) => (
              <StreamCard key={s.id} s={s} active={filter === s.id} onClick={() => setFilter(filter === s.id ? null : s.id)} />
            ))}
          </Group>
          <EpicPanel patient={patient} />
        </div>

        <section className={`${card} h-fit overflow-hidden`} aria-label="Activity">
          <div className="flex items-center justify-between border-b border-[#e7ecea] px-5 py-3">
            <h3 className="text-[13px] font-semibold text-[#29463f]">Activity</h3>
            {filter ? (
              <button onClick={() => setFilter(null)} className="text-[10px] font-semibold text-[#176b54] hover:underline">
                Show all
              </button>
            ) : (
              <span className="text-[10px] text-[#8a9894]">{c.log.length} events</span>
            )}
          </div>
          <ol className="max-h-[720px] divide-y divide-[#f0f3f2] overflow-y-auto">
            {entries.map((l, i) => (
              <li key={i} className="flex gap-3 px-5 py-2.5">
                <Icon name={channelIcon[l.channel]} size={13} className={`mt-0.5 shrink-0 ${actorTone[l.actor]}`} />
                <div className="min-w-0">
                  <p className="text-[11px] leading-snug text-[#3d554f]">{l.text}</p>
                  <p className="mt-0.5 text-[9px] text-[#8a9894]">
                    {clock(l.at)} · {l.actor === "agent" ? "Coordinator" : l.actor === "outside" ? "Outside party" : l.actor === "staff" ? "Staff" : "Family"} ·{" "}
                    {l.channel}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={() => {
            set(undefined)
            navigate(`/coordinator/${patient.id}`)
          }}
          className="text-[11px] font-semibold text-[#a6432f] hover:underline"
        >
          Reset this patient's coordination
        </button>
      </div>
    </>
  )
}

function Group({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className={`${card} p-5`} aria-label={title}>
      <h3 className="text-[13px] font-semibold text-[#29463f]">{title}</h3>
      <p className="mt-0.5 text-[10px] text-[#8a9894]">{subtitle}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  )
}

function StreamCard({ s, active, onClick }: { s: Stream; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
        active ? "border-[#7fb7a6] bg-[#f4faf8]" : "border-[#e2e9e6] bg-white hover:border-[#b9ccc6]"
      }`}
    >
      {s.rank !== undefined && (
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#eef2f0] text-[10px] font-bold text-[#5d7570]">{s.rank}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[12px] font-semibold text-[#29463f]">{s.party}</p>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${tone[statusTone[s.status]]}`}>{s.status.replace("-", " ")}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-[#5e7570]">{s.note}</p>
        <p className="mt-1 text-[9px] text-[#8a9894]">
          {s.label} · {s.channel}
          {s.attempts > 1 ? ` · ${s.attempts} contacts` : ""}
          {s.lastAt ? ` · last ${clock(s.lastAt)}` : ""}
        </p>
      </div>
    </button>
  )
}

function Matches({ c }: { c: Coordination }) {
  const contacted = new Set(c.streams.filter((s) => s.kind === "facility").map((s) => s.id.slice(4)))
  const rest = c.matches.filter((m) => !contacted.has(m.id))
  if (!rest.length) return null
  return (
    <details className="rounded-xl border border-dashed border-[#d7e2de] p-3">
      <summary className="cursor-pointer text-[11px] font-semibold text-[#385149]">
        {contacted.size ? "Other matches and exclusions" : "Matched facilities"} ({rest.length})
      </summary>
      <ul className="mt-2 space-y-2">
        {rest.map((m) => {
          const f = facilityDirectory.find((x) => x.id === m.id)!
          return (
            <li key={m.id} className="text-[10px] leading-relaxed">
              <span className={`font-semibold ${m.excluded ? "text-[#8a9894] line-through" : "text-[#29463f]"}`}>{f.name}</span>{" "}
              {m.excluded ? (
                <span className="text-[#a6432f]">· {m.excluded}</span>
              ) : (
                <span className="text-[#6c807a]">
                  · match {m.score} · {m.reasons.join(" · ")}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </details>
  )
}

function Readiness({ c }: { c: Coordination }) {
  const facility = c.streams.find((s) => s.kind === "facility" && s.status === "confirmed")
  const isHome = !["SNF", "Acute rehab", "LTCH"].includes(c.profile.destination)
  const homeDone = c.streams.filter((s) => ["dme", "homehealth", "infusion"].includes(s.kind))
  const auth = c.streams.find((s) => s.kind === "auth")
  const ride = c.streams.find((s) => s.kind === "transport")
  const items: [string, boolean, string][] = [
    isHome
      ? ["Home services", !!c.admission, c.admission ? "Lined up" : `${homeDone.filter((s) => s.status === "confirmed").length} confirmed`]
      : ["Bed", !!facility, facility ? facility.party : "Waiting on facilities"],
    ["Insurance", !!auth && ["approved", "not-needed"].includes(auth.status), auth ? auth.note : "After placement"],
    ["Ride", ride?.status === "booked", ride ? ride.note : "After insurance"],
    ["Family informed", c.streams.some((s) => s.kind === "family" && s.status === "confirmed"), "By text"],
    ["Discharge", c.ready, c.admission ? when(c.admission.at) : "Not set"],
  ]
  return (
    <section className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-5" aria-label="Discharge readiness">
      {items.map(([label, ok, note]) => (
        <div key={label} className={`rounded-xl border p-3 ${ok ? "border-[#cfe3dc] bg-[#f5fbf8]" : "border-[#e2e9e6] bg-white"}`}>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.06em] text-[#6c807a]">
            <span className={`grid h-4 w-4 place-items-center rounded-full ${ok ? "bg-[#25866a] text-white" : "border border-[#c3d0cc]"}`}>
              {ok && <Icon name="check" size={10} />}
            </span>
            {label}
          </p>
          <p className="mt-1 truncate text-[11px] text-[#3d554f]" title={note}>
            {note}
          </p>
        </div>
      ))}
    </section>
  )
}

function GateCard({ c, gateId, onChange }: { c: Coordination; gateId: string; onChange: (c: Coordination) => void }) {
  const g = c.gates.find((x) => x.id === gateId)!
  const [draft, setDraft] = useState(g.draft ?? "")
  const [note, setNote] = useState("")
  return (
    <div className="rounded-xl border border-[#efe1c4] bg-white p-4">
      <p className="text-[12px] font-semibold text-[#29463f]">{g.title}</p>
      <p className="mt-0.5 text-[11px] text-[#6c807a]">{g.detail}</p>
      {g.kind === "approve-packet" && (
        <>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {c.packet.map((item) => (
              <li key={item.name} className="flex items-center gap-2 text-[11px] text-[#3d554f]">
                <Icon name="check" size={12} className="text-[#25866a]" /> {item.name}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-[#8a9894]">
            {c.familyChoices ? `Family ranked ${c.familyChoices.length} facilities.` : "Family choices are still coming in."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => onChange(approvePacket(c))} className={primaryBtn}>
              <Icon name="check" size={13} /> Approve packet
            </button>
            {!c.familyChoices && (
              <button onClick={() => onChange(approvePacket(sendWithoutFamily(c)))} className={secondaryBtn}>
                Approve and send to top matches now
              </button>
            )}
          </div>
        </>
      )}
      {g.kind === "approve-appeal" && (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Appeal draft"
            className="mt-3 h-48 w-full rounded-lg border border-[#d9e3e0] p-3 font-mono text-[10px] leading-relaxed text-[#3d554f] outline-none focus:border-[#74a99a]"
          />
          <button onClick={() => onChange(approveAppeal(c, draft))} className={`${primaryBtn} mt-2`}>
            <Icon name="check" size={13} /> Approve and sign appeal
          </button>
        </>
      )}
      {g.kind === "family-escalation" && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What you discussed (optional)"
            aria-label="Call note"
            className={`${inputCls} flex-1`}
          />
          <button
            onClick={() => onChange(resolveGate(c, g.id, `Social worker called ${c.profile.family.name}${note.trim() ? `: ${note.trim()}` : ""}`))}
            className={primaryBtn}
          >
            <Icon name="check" size={13} /> Mark called
          </button>
        </div>
      )}
    </div>
  )
}

// ---- Setup -----------------------------------------------------------------------

const homeServiceOptions = ["Skilled nursing", "Physical therapy", "Occupational therapy", "Home health aide"]

function Setup({ patient, onStart }: { patient: Patient; onStart: (p: Profile) => void }) {
  const initial = useMemo(() => defaultProfile(patient), [patient])
  const [form, setForm] = useState<Profile>(initial)
  const [dmeText, setDmeText] = useState(initial.dme.join(", "))
  const isHome = form.destination.startsWith("Home")
  const toggleNeed = (n: Need) =>
    setForm((f) => ({ ...f, needs: f.needs.includes(n) ? f.needs.filter((x) => x !== n) : [...f.needs, n] }))
  const toggleService = (n: string) =>
    setForm((f) => ({ ...f, homeServices: f.homeServices.includes(n) ? f.homeServices.filter((x) => x !== n) : [...f.homeServices, n] }))

  return (
    <>
      <PageHeader crumb="Coordinator" title={`Set up coordination · ${patient.name}`} subtitle="A short profile is all the coordinator needs. It runs the outside outreach from here." />
      <SimNotice />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onStart({ ...form, dme: dmeText.split(",").map((x) => x.trim()).filter(Boolean), homeServices: isHome ? form.homeServices : [] })
        }}
        className={`${card} grid gap-4 p-5 md:grid-cols-2 md:p-6`}
      >
        <label>
          <span className={labelCls}>Destination</span>
          <select value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value as Profile["destination"] })} className={inputCls}>
            {destinations.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Insurance</span>
          <input value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Home zip code</span>
          <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>When a caregiver can be home</span>
          <input value={form.caregiverWindow} onChange={(e) => setForm({ ...form, caregiverWindow: e.target.value })} className={inputCls} />
        </label>
        <fieldset className="md:col-span-2">
          <legend className={labelCls}>Care needs the destination must handle</legend>
          <div className="flex flex-wrap gap-2">
            {allNeeds.map((n) => (
              <label key={n} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] ${form.needs.includes(n) ? "border-[#7fb7a6] bg-[#f4faf8] text-[#176b54]" : "border-[#dce4e2] text-[#5d7570]"}`}>
                <input type="checkbox" checked={form.needs.includes(n)} onChange={() => toggleNeed(n)} className="accent-[#156d53]" />
                {n}
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          <span className={labelCls}>Family contact name</span>
          <input value={form.family.name} onChange={(e) => setForm({ ...form, family: { ...form.family, name: e.target.value } })} className={inputCls} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className={labelCls}>Relation</span>
            <input value={form.family.relation} onChange={(e) => setForm({ ...form, family: { ...form.family, relation: e.target.value } })} className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>Phone (fake numbers only)</span>
            <input value={form.family.phone} onChange={(e) => setForm({ ...form, family: { ...form.family, phone: e.target.value } })} className={inputCls} />
          </label>
        </div>
        {isHome && (
          <>
            <label className="md:col-span-2">
              <span className={labelCls}>Equipment to deliver (comma-separated)</span>
              <input value={dmeText} onChange={(e) => setDmeText(e.target.value)} placeholder="e.g. Walker, Hospital bed" className={inputCls} />
            </label>
            <fieldset className="md:col-span-2">
              <legend className={labelCls}>Home services</legend>
              <div className="flex flex-wrap gap-2">
                {homeServiceOptions.map((n) => (
                  <label key={n} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] ${form.homeServices.includes(n) ? "border-[#7fb7a6] bg-[#f4faf8] text-[#176b54]" : "border-[#dce4e2] text-[#5d7570]"}`}>
                    <input type="checkbox" checked={form.homeServices.includes(n)} onChange={() => toggleService(n)} className="accent-[#156d53]" />
                    {n}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        <div className="flex justify-end md:col-span-2">
          <button type="submit" className={primaryBtn}>
            <Icon name="bolt" size={14} /> Start coordinating
          </button>
        </div>
      </form>
    </>
  )
}
