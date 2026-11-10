import { useState, type ReactNode } from "react"
import { aiReady, summarizeRounds, type RoundsSummary } from "../ai"
import { readiness } from "../logic"
import { statements } from "../summarize"
import { formatClock, useAmbientCapture } from "../ambient"
import { emptyAssessment, type AGKey, type Assessment, type Patient, type Task } from "../data"
import { AssessmentEditor, AssessmentList, SummaryPoints } from "./ClinicalSummary"
import { useStore } from "../store"
import { Icon, UrgencyBadge, primaryBtn, secondaryBtn } from "../ui"

type Phase = "capture" | "summarizing" | "review" | "applied"

const textareaCls =
  "w-full resize-y rounded-xl border border-[#d9e3e0] bg-white p-3 text-[11px] leading-relaxed text-[#50635e] outline-none focus:border-[#74a99a] focus:ring-2 focus:ring-[#dceee8]"

export function RoundsEditor({ patient }: { patient: Patient }) {
  const { state, dispatch, notify } = useStore()
  const [phase, setPhase] = useState<Phase>("capture")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RoundsSummary | null>(null)
  const [pickTasks, setPickTasks] = useState<boolean[]>([])
  const [pickDone, setPickDone] = useState<boolean[]>([])
  const [pickUrgency, setPickUrgency] = useState<boolean[]>([])
  const [applied, setApplied] = useState(0)
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [ag, setAg] = useState<Assessment>(emptyAssessment)

  const mic = useAmbientCapture((text) => dispatch({ type: "appendTranscript", pid: patient.id, text }))
  const useClaude = aiReady(state.ai)
  const hasInput = !!(patient.transcript.trim() || patient.notes.trim())
  const phrases = patient.transcript.split("\n").map((l) => l.trim()).filter(Boolean)
  const phraseCount = phrases.length
  const lastHeard = phrases[phraseCount - 1]
  const statementCount = patient.transcript.trim() ? statements(patient.transcript).length : 0
  const taskById = new Map(patient.tasks.map((t) => [t.id, t]))

  const summarize = async () => {
    if (mic.listening) mic.stop()
    setError(null)
    setPhase("summarizing")
    try {
      const s = await summarizeRounds(patient, patient.transcript, patient.notes, state.ai)
      setResult(s)
      setPickTasks(s.newTasks.map(() => true))
      setPickDone(s.completed.map(() => true))
      setPickUrgency(s.urgency.map(() => true))
      setAg(s.assessment)
      setPhase("review")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summarizing failed.")
      setPhase("capture")
    }
  }

  const apply = () => {
    if (!result) return
    const now = Date.now()
    const tasks: Task[] = result.newTasks
      .filter((_, i) => pickTasks[i])
      .map(({ evidence: _e, ...t }, i) => ({ ...t, id: `${patient.id}-r${now}-${i}`, completed: false }))
    const complete = result.completed.filter((_, i) => pickDone[i]).map((c) => c.taskId)
    const urgency = result.urgency.filter((_, i) => pickUrgency[i])
    dispatch({ type: "applyRounds", pid: patient.id, summary: { ...result, assessment: ag }, tasks, complete, urgency })
    const count = tasks.length + complete.length + urgency.length
    setApplied(count)
    setPhase("applied")
    notify(count ? `Checklist updated for ${patient.name}` : `${patient.name} marked as rounded`)
  }

  const selectedCount =
    pickTasks.filter(Boolean).length + pickDone.filter(Boolean).length + pickUrgency.filter(Boolean).length

  if (phase === "review" && result) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-[13px] font-semibold text-[#29463f]">Rounds summary · {patient.name}</h4>
          <span className="rounded-full bg-[#e4f1ed] px-2.5 py-1 text-[9px] font-semibold text-[#156b52]">
            {result.engine === "claude" ? "Claude · AI summary" : "Built-in summarizer"}
          </span>
          <span className="ml-auto text-[10px] text-[#8a9894]">Nothing changes until you apply.</span>
        </div>
        <p className="-mt-3 text-[10px] text-[#6c807a]">
          {patient.diagnosis} · hospital day {patient.los} · {patient.disposition} · target {patient.target} · readiness {readiness(patient)}%
        </p>

        <section className="rounded-xl border border-[#dbe4e1] bg-[#f9fbfa] p-4">
          <SummaryPoints points={result.summary} />
          {result.findings.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.findings.map((f) => (
                <span key={f} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-[#3f6a5d] ring-1 ring-[#d7e5e0]">
                  {f}
                </span>
              ))}
            </div>
          )}
          {result.outlook && (
            <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-[#2f6b5a]">
              <Icon name="calendar" size={12} />
              {result.outlook}
            </p>
          )}
        </section>

        <section aria-label="A–G assessment">
          <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#6c807a]">A–G assessment</h5>
          <p className="mb-3 text-[10px] text-[#8a9894]">Edit anything that's wrong. Letters left blank keep the previous finding.</p>
          <AssessmentEditor
            value={ag}
            previous={patient.assessment}
            onChange={(k: AGKey, text) => setAg((a) => ({ ...a, [k]: text }))}
          />
        </section>

        <ChangeGroup title="New tasks" count={result.newTasks.length} empty="No new action items were discussed.">
          {result.newTasks.map((t, i) => (
            <ChangeRow
              key={i}
              checked={pickTasks[i]}
              onChange={(v) => setPickTasks((p) => p.map((x, j) => (j === i ? v : x)))}
              label={`Add task: ${t.title}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[12px] font-semibold text-[#29463f]">{t.title}</p>
                <UrgencyBadge urgency={t.urgency} />
              </div>
              <p className="mt-0.5 text-[11px] text-[#5e7570]">{t.detail}</p>
              <p className="mt-1 text-[10px] text-[#8a9894]">
                {t.owner} · {t.category} · {t.due} · {t.effort}
              </p>
              <Evidence text={t.evidence} />
            </ChangeRow>
          ))}
        </ChangeGroup>

        {result.completed.length > 0 && (
          <ChangeGroup title="Mark complete" count={result.completed.length}>
            {result.completed.map((c, i) => (
              <ChangeRow
                key={c.taskId}
                checked={pickDone[i]}
                onChange={(v) => setPickDone((p) => p.map((x, j) => (j === i ? v : x)))}
                label={`Mark complete: ${taskById.get(c.taskId)?.title}`}
              >
                <p className="text-[12px] font-semibold text-[#29463f]">{taskById.get(c.taskId)?.title}</p>
                <Evidence text={c.evidence} />
              </ChangeRow>
            ))}
          </ChangeGroup>
        )}

        {result.urgency.length > 0 && (
          <ChangeGroup title="Change urgency" count={result.urgency.length}>
            {result.urgency.map((u, i) => {
              const task = taskById.get(u.taskId)
              return (
                <ChangeRow
                  key={u.taskId}
                  checked={pickUrgency[i]}
                  onChange={(v) => setPickUrgency((p) => p.map((x, j) => (j === i ? v : x)))}
                  label={`Change urgency: ${task?.title}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12px] font-semibold text-[#29463f]">{task?.title}</p>
                    {task && <UrgencyBadge urgency={task.urgency} />}
                    <Icon name="arrow" size={12} className="text-[#8a9894]" />
                    <UrgencyBadge urgency={u.urgency} />
                  </div>
                  <Evidence text={u.reason} />
                </ChangeRow>
              )
            })}
          </ChangeGroup>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-[#e7ecea] pt-4 sm:flex-row sm:justify-end">
          <button onClick={() => setPhase("capture")} className={secondaryBtn}>
            Back to capture
          </button>
          <button onClick={apply} className={primaryBtn}>
            <Icon name="check" size={14} />
            {selectedCount ? `Apply ${selectedCount} change${selectedCount === 1 ? "" : "s"}` : "Finish round"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {phase === "applied" && (
        <div className="flex items-start gap-3 rounded-xl border border-[#cce5dc] bg-[#eff8f5] p-3.5" role="status">
          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#268268] text-white">
            <Icon name="check" size={13} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#225e4e]">
              {applied ? `${applied} change${applied === 1 ? "" : "s"} applied to the checklist` : "Round finished"}
            </p>
            <p className="mt-0.5 text-[10px] text-[#618078]">
              The summary is saved to {patient.name}'s dashboard and the raw transcript was discarded. Readiness has been
              recalculated.
            </p>
          </div>
          <a href={`#/patients/${patient.id}`} className="shrink-0 text-[11px] font-semibold text-[#176b54] hover:underline">
            Open checklist
          </a>
        </div>
      )}

      <section
        className={`rounded-2xl p-4 transition ${mic.listening ? "bg-[#103f33] text-white" : "border border-[#dbe4e1] bg-[#f6faf8]"}`}
        aria-label="Ambient capture"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            onClick={mic.listening || mic.preparing ? mic.stop : mic.start}
            disabled={phase === "summarizing"}
            aria-pressed={mic.listening}
            aria-label={mic.listening ? "Pause ambient capture" : mic.preparing ? "Cancel ambient capture" : "Start ambient capture"}
            className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full transition disabled:opacity-50 ${
              mic.listening ? "bg-[#e0594a] text-white hover:bg-[#c94b3d]" : "bg-[#156d53] text-white hover:bg-[#105b45]"
            }`}
          >
            {mic.listening && <span className="absolute inset-0 animate-ping rounded-full bg-[#e0594a]/40" />}
            {mic.preparing ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Icon name={mic.listening ? "stop" : "mic"} size={22} className="relative" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className={`text-[12px] font-semibold ${mic.listening ? "text-white" : "text-[#29463f]"}`}>
              {mic.listening
                ? `Listening · ${formatClock(mic.elapsed)}`
                : mic.preparing
                  ? mic.preparingLabel
                  : mic.elapsed
                    ? `Paused · ${formatClock(mic.elapsed)}`
                    : "Ambient capture"}
              {mic.listening && mic.engine && (
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-medium">
                  {mic.engine === "device" ? "On-device" : "Browser cloud speech"}
                </span>
              )}
            </p>
            <p className={`text-[10px] ${mic.listening ? "text-white/70" : "text-[#7b8b87]"}`}>
              {mic.listening
                ? mic.interim
                  ? `Hearing: ${mic.interim}`
                  : lastHeard
                    ? `Captured ${phraseCount} phrase${phraseCount === 1 ? "" : "s"} · last: “${lastHeard.length > 90 ? `${lastHeard.slice(0, 90)}…` : lastHeard}”`
                    : "Speak normally at the bedside. The round is summarized when it ends."
                : mic.supported
                  ? "Start the mic when you reach the bedside. When the round ends, tap End round & summarize."
                  : "Live transcription needs Chrome, Edge or Safari. You can still type or paste the transcript."}
            </p>
          </div>
          <button
            onClick={summarize}
            disabled={phase === "summarizing" || !hasInput}
            className={`${primaryBtn} shrink-0 ${mic.listening ? "bg-white text-[#156d53] hover:bg-[#e8f3ef]" : ""}`}
          >
            {phase === "summarizing" ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                {useClaude ? "Claude is summarizing…" : "Summarizing…"}
              </>
            ) : (
              <>
                <Icon name="sparkles" size={14} />
                End round & summarize
              </>
            )}
          </button>
        </div>
        {mic.error && (
          <p className="mt-3 rounded-lg bg-[#fdeee9] px-3 py-2 text-[10px] font-medium text-[#a6432f]" role="alert">
            {mic.error}
          </p>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-[#fdeee9] px-3 py-2 text-[11px] font-medium text-[#a6432f]" role="alert">
          {error}
        </p>
      )}

      <LastRound patient={patient} />

      <details className="group rounded-xl border border-[#e2e9e6] bg-white" open={transcriptOpen} onToggle={(e) => setTranscriptOpen(e.currentTarget.open)}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-[11px] font-semibold text-[#385149]">
          <Icon name="chevron" size={12} className="text-[#8a9894] transition group-open:rotate-90" />
          Raw transcript
          <span className="font-normal text-[#8a9894]">
            {statementCount ? `${statementCount} statement${statementCount === 1 ? "" : "s"} captured` : "empty"} · input only, discarded after the round
          </span>
        </summary>
        <div className="space-y-2 border-t border-[#eef2f0] p-3.5">
          <textarea
            value={patient.transcript}
            onChange={(e) => dispatch({ type: "updateRounds", pid: patient.id, transcript: e.target.value, notes: patient.notes })}
            placeholder="The live transcript appears here. You can also type or paste what was said on rounds."
            aria-label="Raw transcript"
            className={`${textareaCls} h-32`}
          />
          {patient.transcript && !mic.listening && (
            <button
              type="button"
              onClick={() => {
                dispatch({ type: "updateRounds", pid: patient.id, transcript: "", notes: patient.notes })
                mic.resetTimer()
              }}
              className="text-[10px] font-semibold text-[#8a6a5f] hover:text-[#b64f3c]"
            >
              Clear transcript
            </button>
          )}
        </div>
      </details>
      <label className="block">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#385149]">Documented clinical notes</span>
          <span className="text-[9px] text-[#889691]">Optional</span>
        </div>
        <textarea
          value={patient.notes}
          onChange={(e) => dispatch({ type: "updateRounds", pid: patient.id, transcript: patient.transcript, notes: e.target.value })}
          placeholder="Progress note, assessment and plan…"
          className={`${textareaCls} h-20`}
        />
      </label>

      <div className="flex flex-col gap-2 rounded-xl bg-[#f1f5f3] px-3.5 py-3 text-[10px] leading-relaxed text-[#61756f] sm:flex-row sm:items-center">
        <Icon name="shield" size={13} className="shrink-0 text-[#238066]" />
        <p className="flex-1">
          {useClaude
            ? "Summaries are written by Claude and shown for review before anything changes."
            : "Summaries are built in the browser from this patient's checklist and shown for review before anything changes. Connect Claude in Settings for fuller written summaries."}{" "}
          Demo only: don't record real patient information.{" "}
          {mic.engine === "device"
            ? "Speech is transcribed on this device."
            : "When on-device speech isn't available, the browser's speech service may send audio to Google or Apple."}
        </p>
        {!useClaude && (
          <a href="#/settings" className="shrink-0 font-semibold text-[#176b54] hover:underline">
            Connect Claude
          </a>
        )}
      </div>
    </div>
  )
}

function LastRound({ patient }: { patient: Patient }) {
  return (
    <section className="rounded-xl border border-[#dbe4e1] bg-[#f9fbfa] p-4" aria-label="Last round summary">
      <div className="flex flex-wrap items-center gap-2">
        <h5 className="text-[11px] font-semibold uppercase tracking-wide text-[#6c807a]">Last round summary</h5>
        <span className="text-[10px] text-[#8a9894]">{patient.roundedAt ? `Rounded ${patient.roundedAt}` : "Not rounded yet today"}</span>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-[1.1fr_1fr]">
        <SummaryPoints points={patient.summary} />
        <div className="border-t border-[#e3ebe8] pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <AssessmentList assessment={patient.assessment} compact />
        </div>
      </div>
      {patient.outlook && (
        <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-[#2f6b5a]">
          <Icon name="calendar" size={12} />
          {patient.outlook}
        </p>
      )}
    </section>
  )
}

function ChangeGroup({ title, count, empty, children }: { title: string; count: number; empty?: string; children: ReactNode }) {
  return (
    <section>
      <h5 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6c807a]">
        {title} <span className="text-[#9aa8a4]">({count})</span>
      </h5>
      {count === 0 ? <p className="text-[11px] text-[#8a9894]">{empty}</p> : <ul className="space-y-2">{children}</ul>}
    </section>
  )
}

function ChangeRow({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  children: ReactNode
}) {
  return (
    <li>
      <label
        className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
          checked ? "border-[#bfdcd2] bg-white" : "border-[#e2e9e6] bg-[#fafcfb] opacity-60"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#156d53]"
        />
        <div className="min-w-0 flex-1">{children}</div>
      </label>
    </li>
  )
}

function Evidence({ text }: { text: string }) {
  if (!text) return null
  return <p className="mt-1.5 border-l-2 border-[#cfe1db] pl-2 text-[10px] italic text-[#6f837d]">{text}</p>
}
