import { readiness, status } from "../logic"
import { navigate, useStore } from "../store"
import { RoundsEditor } from "../components/Modals"
import { Avatar, Icon, PageHeader, StatusBadge, card, secondaryBtn } from "../ui"
import type { Patient } from "../data"

export function Rounds({ patient }: { patient: Patient }) {
  const { state, dispatch, notify } = useStore()
  const rounded = state.patients.filter((p) => p.roundedAt).length

  return (
    <>
      <PageHeader
        crumb="Rounds"
        title="Morning rounds"
        subtitle={`${rounded} of ${state.patients.length} patients rounded · Ambient transcripts feed each patient's checklist.`}
      />
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <section className={`${card} h-fit overflow-hidden`}>
          <div className="border-b border-[#e7ecea] px-5 py-4">
            <h3 className="text-[12px] font-semibold text-[#29463f]">Rounding list</h3>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7edeb]">
              <div
                className="h-full rounded-full bg-[#35a881] transition-all"
                style={{ width: `${state.patients.length ? (rounded / state.patients.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          <ul className="max-h-[560px] divide-y divide-[#edf1ef] overflow-y-auto">
            {state.patients.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => navigate(`/rounds/${p.id}`)}
                  aria-current={p.id === patient.id}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition ${
                    p.id === patient.id ? "bg-[#eef6f3]" : "hover:bg-[#f6faf8]"
                  }`}
                >
                  <Avatar initials={p.initials} color={p.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-[#29463f]">{p.name}</p>
                    <p className="text-[10px] text-[#82918d]">{p.room}</p>
                  </div>
                  {p.roundedAt ? (
                    <span className="flex items-center gap-1 text-[9px] font-semibold text-[#2f7a62]">
                      <Icon name="check" size={11} />
                      {p.roundedAt}
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#fff0d6] px-2 py-0.5 text-[9px] font-semibold text-[#9a6217]">Pending</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${card} p-5 md:p-6`}>
          <div className="mb-5 flex flex-col gap-3 border-b border-[#e7ecea] pb-5 sm:flex-row sm:items-center">
            <Avatar initials={patient.initials} color={patient.color} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[17px] font-semibold tracking-tight text-[#173d34]">{patient.name}</h3>
                <StatusBadge status={status(patient)} />
              </div>
              <p className="text-[11px] text-[#7b8b87]">
                {patient.age} {patient.sex} · MRN {patient.mrn} · {patient.room} · {patient.diagnosis} · {readiness(patient)}% ready
              </p>
            </div>
            <div className="flex gap-2">
              {!patient.roundedAt && (
                <button
                  onClick={() => {
                    dispatch({ type: "markRounded", pid: patient.id })
                    notify(`${patient.name} marked as rounded`)
                  }}
                  className={secondaryBtn}
                >
                  <Icon name="check" size={14} />
                  Mark rounded
                </button>
              )}
              <a href={`#/patients/${patient.id}`} className={secondaryBtn}>
                Open checklist
                <Icon name="arrow" size={13} />
              </a>
            </div>
          </div>
          <RoundsEditor key={patient.id} patient={patient} />
          <p className="mt-4 flex items-start gap-2 text-[10px] leading-relaxed text-[#8a9894]">
            <Icon name="shield" size={12} className="mt-0.5 shrink-0" />
            Edits save automatically in this browser. The checklist generator matches the transcript and notes against
            discharge rules and only adds tasks that aren't already on the patient's checklist.
          </p>
        </section>
      </div>
    </>
  )
}
