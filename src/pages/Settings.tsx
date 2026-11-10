import { useState } from "react"
import { useStore, type Settings as SettingsType } from "../store"
import { Icon, Modal, PageHeader, card } from "../ui"
import { AiSettingsCard } from "../components/AiSettings"

const toggles: { key: keyof SettingsType; label: string; detail: string }[] = [
  { key: "highPriorityAlerts", label: "High-priority task alerts", detail: "Notify me when a high-urgency task is overdue." },
  { key: "ambientSync", label: "Ambient rounds sync", detail: "Pull rounds transcripts into each patient's notes automatically." },
  { key: "dailyDigest", label: "End-of-day digest", detail: "Email a summary of discharges and open tasks at 6 PM." },
  { key: "showCompleted", label: "Show completed tasks on the task board", detail: "Include finished tasks when the task board opens." },
]

export function Settings() {
  const { state, dispatch, notify } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <>
      <PageHeader crumb="Settings" title="Settings" subtitle="Your profile, notifications, AI summarizer and demo data." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className={`${card} p-5 md:p-6`}>
          <h3 className="text-[13px] font-semibold text-[#29463f]">Profile</h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#d9e7ff] text-[16px] font-semibold text-[#31527c]">LC</div>
            <div>
              <p className="text-[15px] font-semibold text-[#1b4037]">Dr. Lena Chen</p>
              <p className="text-[11px] text-[#7b8b87]">Attending physician · Hospital medicine</p>
              <p className="text-[11px] text-[#7b8b87]">4 West · Pager x4412</p>
            </div>
          </div>
          <dl className="mt-5 space-y-2.5 border-t border-[#edf1ef] pt-4 text-[11px]">
            {[
              ["Unit", "4 West Medicine"],
              ["Shift", "7:00 AM – 7:00 PM"],
              ["Patients on list", String(state.patients.length)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-[#8a9894]">{k}</dt>
                <dd className="font-medium text-[#3d554f]">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${card} p-5 md:p-6`}>
          <h3 className="text-[13px] font-semibold text-[#29463f]">Preferences</h3>
          <ul className="mt-2 divide-y divide-[#edf1ef]">
            {toggles.map((t) => {
              const on = state.settings[t.key]
              return (
                <li key={t.key} className="flex items-center gap-4 py-3.5">
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-[#3d554f]">{t.label}</p>
                    <p className="text-[10px] text-[#8a9894]">{t.detail}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={t.label}
                    onClick={() => dispatch({ type: "setting", key: t.key, value: !on })}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#25866a]" : "bg-[#cfd9d6]"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <AiSettingsCard />

        <section className={`${card} p-5 md:p-6 lg:col-span-2`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fde7e1] text-[#bf5946]">
              <Icon name="refresh" size={18} />
            </div>
            <div className="flex-1">
              <h3 className="text-[13px] font-semibold text-[#29463f]">Reset demo data</h3>
              <p className="text-[11px] text-[#7b8b87]">
                Your changes (completed tasks, new patients, messages) are saved in this browser. Resetting restores the
                original 8 patients.
              </p>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              className="rounded-xl border border-[#f0d6ce] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#b64f3c] hover:bg-[#fdf0ec]"
            >
              Reset data
            </button>
          </div>
        </section>
      </div>

      {confirmReset && (
        <Modal
          title="Reset demo data?"
          subtitle="This restores the original patients, tasks and messages."
          icon="refresh"
          width={460}
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <button
                onClick={() => setConfirmReset(false)}
                className="rounded-xl px-4 py-2.5 text-[11px] font-semibold text-[#667873] hover:bg-[#edf2f0]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  dispatch({ type: "reset" })
                  setConfirmReset(false)
                  notify("Demo data reset")
                }}
                className="rounded-xl bg-[#b64f3c] px-4 py-2.5 text-[11px] font-semibold text-white hover:bg-[#9c3f2e]"
              >
                Reset data
              </button>
            </>
          }
        >
          <p className="text-[12px] leading-relaxed text-[#526a64]">
            Everything you've changed in this browser will be cleared. This can't be undone.
          </p>
        </Modal>
      )}
    </>
  )
}
