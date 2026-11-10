import { useState } from "react"
import { patientColors, staff, type Patient, type Task, type Urgency } from "../data"
import { navigate, useStore } from "../store"
import { RoundsEditor } from "./RoundsEditor"
import { Avatar, Icon, Modal, inputCls, labelCls, primaryBtn } from "../ui"

export function GeneratorModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  return (
    <Modal
      title="Generate readiness checklist"
      subtitle="Combine ambient rounds and documented clinical data."
      onClose={onClose}
    >
      <div className="rounded-xl border border-[#dbe4e1] bg-[#f9fbfa] p-4">
        <div className="flex items-center gap-3">
          <Avatar initials={patient.initials} color={patient.color} size={36} />
          <div>
            <p className="text-xs font-semibold text-[#29463f]">{patient.name}</p>
            <p className="text-[10px] text-[#82918d]">
              {patient.age} {patient.sex} · MRN {patient.mrn} · {patient.room}
            </p>
          </div>
          <span className="ml-auto rounded-full bg-[#e4f1ed] px-2.5 py-1 text-[9px] font-semibold text-[#156b52]">
            Selected
          </span>
        </div>
      </div>
      <RoundsEditor patient={patient} />
    </Modal>
  )
}

export function CareTeamModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const members = staff.filter((s) => patient.careTeam.includes(s.id))

  const message = (staffId: string) => {
    const existing = state.threads.find((t) => t.staffId === staffId && t.patientId === patient.id)
    if (existing) {
      navigate(`/messages/${existing.id}`)
    } else {
      const id = `t-${staffId}-${patient.id}-${Date.now()}`
      dispatch({
        type: "startThread",
        thread: { id, staffId, patientId: patient.id, subject: `${patient.name}`, unread: false, messages: [] },
      })
      navigate(`/messages/${id}`)
    }
    onClose()
  }

  return (
    <Modal title="Care team" subtitle={`${patient.name} · ${patient.room}`} icon="patients" onClose={onClose} width={520}>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[#e2e9e6] p-3">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[11px] font-bold"
              style={{ background: m.color, color: m.text }}
            >
              {m.initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#29463f]">{m.name}</p>
              <p className="text-[10px] text-[#82918d]">
                {m.role} · Pager {m.pager}
              </p>
            </div>
            <span
              className={`ml-auto flex items-center gap-1.5 text-[9px] font-medium ${m.online ? "text-[#2f7a62]" : "text-[#8a9894]"}`}
            >
              <span className={`h-2 w-2 rounded-full ${m.online ? "bg-[#4ab18f]" : "bg-[#c6d0cd]"}`} />
              {m.online ? "On shift" : "Away"}
            </span>
            {m.id !== "LC" && (
              <button
                onClick={() => message(m.id)}
                aria-label={`Message ${m.name}`}
                className="rounded-lg border border-[#d9e3e0] p-2 text-[#176b54] hover:bg-[#edf6f2]"
              >
                <Icon name="message" size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}

const owners = [
  "Dr. Chen",
  "Nursing",
  "Case Management",
  "Physical Therapy",
  "Occupational Therapy",
  "Respiratory Therapy",
  "Clinical Pharmacy",
  "Social Work",
  "Unit Coordinator",
]
const categories = ["Clinical", "Coordination", "Education", "Follow-up", "Documentation"]

export function AddTaskModal({ defaultPatientId, onClose }: { defaultPatientId?: string; onClose: () => void }) {
  const { state, dispatch, notify } = useStore()
  const [form, setForm] = useState({
    pid: defaultPatientId ?? state.selectedId,
    title: "",
    detail: "",
    owner: owners[0],
    urgency: "Medium" as Urgency,
    effort: "15",
    due: "Due today",
    category: categories[0],
  })
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value })

  const submit = () => {
    if (!form.title.trim()) return
    const task: Task = {
      id: `${form.pid}-m${Date.now()}`,
      title: form.title.trim(),
      detail: form.detail.trim() || "Added manually.",
      owner: form.owner,
      due: form.due || "Due today",
      urgency: form.urgency,
      effort: `${Math.max(1, parseInt(form.effort, 10) || 15)} min`,
      completed: false,
      category: form.category,
    }
    dispatch({ type: "addTasks", pid: form.pid, tasks: [task] })
    const patient = state.patients.find((p) => p.id === form.pid)
    notify(`Added "${task.title}" for ${patient?.name}`)
    onClose()
  }

  return (
    <Modal
      title="Add task"
      subtitle="Add a discharge task to a patient's checklist."
      icon="plus"
      onClose={onClose}
      width={560}
      footer={
        <>
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-[11px] font-semibold text-[#667873] hover:bg-[#edf2f0]">
            Cancel
          </button>
          <button onClick={submit} disabled={!form.title.trim()} className={primaryBtn}>
            <Icon name="plus" size={14} />
            Add task
          </button>
        </>
      }
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <label className="sm:col-span-2">
          <span className={labelCls}>Patient</span>
          <select value={form.pid} onChange={set("pid")} className={inputCls}>
            {state.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.room}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>Task</span>
          <input autoFocus value={form.title} onChange={set("title")} placeholder="e.g. Confirm walker delivery" className={inputCls} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>Details</span>
          <input value={form.detail} onChange={set("detail")} placeholder="Optional" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Owner</span>
          <select value={form.owner} onChange={set("owner")} className={inputCls}>
            {owners.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Category</span>
          <select value={form.category} onChange={set("category")} className={inputCls}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Urgency</span>
          <select value={form.urgency} onChange={set("urgency")} className={inputCls}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <label>
          <span className={labelCls}>Effort (minutes)</span>
          <input type="number" min={1} value={form.effort} onChange={set("effort")} className={inputCls} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>Due</span>
          <input value={form.due} onChange={set("due")} className={inputCls} />
        </label>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}

export function AddPatientModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, notify } = useStore()
  const [form, setForm] = useState({
    first: "",
    last: "",
    age: "",
    sex: "F" as "M" | "F",
    room: "",
    diagnosis: "",
    disposition: "Home",
    target: "Tomorrow",
  })
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value })
  const valid = form.first.trim() && form.last.trim() && form.diagnosis.trim() && Number(form.age) > 0

  const submit = () => {
    if (!valid) return
    const name = `${form.first.trim()} ${form.last.trim()}`
    const id = `${name.toLowerCase().replace(/[^a-z]+/g, "-")}-${Date.now().toString(36)}`
    const patient: Patient = {
      id,
      initials: `${form.first.trim()[0]}${form.last.trim()[0]}`.toUpperCase(),
      name,
      age: Number(form.age),
      sex: form.sex,
      mrn: String(240000 + Math.floor(Math.random() * 9999)),
      room: form.room.trim() ? `4W · ${form.room.trim()}` : "4W · TBD",
      color: patientColors[state.patients.length % patientColors.length],
      diagnosis: form.diagnosis.trim(),
      los: 0,
      target: form.target || "TBD",
      disposition: form.disposition,
      baseline: 30,
      summary: "New admission. Add rounds notes and generate a checklist to build the discharge plan.",
      detected: [],
      transcript: "",
      notes: "",
      careTeam: ["LC", "KO", "MR"],
      confidence: "Not enough data",
      trend: [2, 2, 3, 3, 3, 4, 4, 4],
      trendNote: "Awaiting first rounds",
      roundedAt: null,
      coverage: "Verification pending",
      plan: [
        { label: "Destination", value: form.disposition },
        { label: "Equipment", value: "To be assessed" },
        { label: "Follow-up", value: "To be scheduled" },
        { label: "Transport", value: "To be confirmed" },
      ],
      tasks: [],
    }
    dispatch({ type: "addPatient", patient })
    notify(`${name} added. Add rounds notes to build their checklist.`)
    navigate(`/rounds/${id}`)
    onClose()
  }

  return (
    <Modal
      title="Add patient"
      subtitle="Admit a patient to your discharge list."
      icon="user"
      onClose={onClose}
      width={560}
      footer={
        <>
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-[11px] font-semibold text-[#667873] hover:bg-[#edf2f0]">
            Cancel
          </button>
          <button onClick={submit} disabled={!valid} className={primaryBtn}>
            <Icon name="plus" size={14} />
            Add patient
          </button>
        </>
      }
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <label>
          <span className={labelCls}>First name</span>
          <input autoFocus value={form.first} onChange={set("first")} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Last name</span>
          <input value={form.last} onChange={set("last")} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Age</span>
          <input type="number" min={0} max={120} value={form.age} onChange={set("age")} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Sex</span>
          <select value={form.sex} onChange={set("sex")} className={inputCls}>
            <option value="F">Female</option>
            <option value="M">Male</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>Primary diagnosis</span>
          <input value={form.diagnosis} onChange={set("diagnosis")} placeholder="e.g. Atrial fibrillation with RVR" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Room</span>
          <input value={form.room} onChange={set("room")} placeholder="e.g. 427" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Target discharge</span>
          <input value={form.target} onChange={set("target")} className={inputCls} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>Expected disposition</span>
          <select value={form.disposition} onChange={set("disposition")} className={inputCls}>
            <option>Home</option>
            <option>Home with home health</option>
            <option>Home with oxygen</option>
            <option>Skilled nursing facility</option>
            <option>Inpatient rehab</option>
          </select>
        </label>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
