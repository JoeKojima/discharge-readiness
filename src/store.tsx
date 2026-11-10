import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react"
import {
  seedPatients,
  seedThreads,
  type Patient,
  type Task,
  type Thread,
  type Urgency,
} from "./data"
import { nowTime } from "./logic"
import { defaultAiSettings, type AiSettings, type RoundsSummary } from "./ai"

export type Settings = {
  highPriorityAlerts: boolean
  ambientSync: boolean
  dailyDigest: boolean
  showCompleted: boolean
}

export type State = {
  version: number
  signedIn: boolean
  selectedId: string
  patients: Patient[]
  threads: Thread[]
  settings: Settings
  ai: AiSettings
}

const VERSION = 2
const KEY = "clearpath-state"

export const initialState = (): State => ({
  version: VERSION,
  signedIn: true,
  selectedId: seedPatients[0].id,
  patients: structuredClone(seedPatients),
  threads: structuredClone(seedThreads),
  settings: {
    highPriorityAlerts: true,
    ambientSync: true,
    dailyDigest: false,
    showCompleted: true,
  },
  ai: { ...defaultAiSettings },
})

type Action =
  | { type: "select"; id: string }
  | { type: "toggleTask"; pid: string; tid: string }
  | { type: "setUrgency"; pid: string; tid: string; urgency: Urgency }
  | { type: "deleteTask"; pid: string; tid: string }
  | { type: "addTasks"; pid: string; tasks: Task[] }
  | { type: "addPatient"; patient: Patient }
  | { type: "dischargePatient"; pid: string }
  | { type: "updateRounds"; pid: string; transcript: string; notes: string }
  | { type: "markRounded"; pid: string }
  | { type: "appendTranscript"; pid: string; text: string }
  | { type: "applyRounds"; pid: string; summary: RoundsSummary; tasks: Task[]; complete: string[]; urgency: { taskId: string; urgency: Urgency }[] }
  | { type: "aiConfig"; ai: Partial<AiSettings> }
  | { type: "sendReferral"; pid: string; facility: string }
  | { type: "sendMessage"; threadId: string; text: string; from: "me" | "them" }
  | { type: "startThread"; thread: Thread }
  | { type: "readThread"; threadId: string }
  | { type: "setting"; key: keyof Settings; value: boolean }
  | { type: "signOut" }
  | { type: "signIn" }
  | { type: "reset" }

function mapPatient(state: State, pid: string, fn: (p: Patient) => Patient): State {
  return { ...state, patients: state.patients.map((p) => (p.id === pid ? fn(p) : p)) }
}

function mapTask(state: State, pid: string, tid: string, fn: (t: Task) => Task): State {
  return mapPatient(state, pid, (p) => ({
    ...p,
    tasks: p.tasks.map((t) => (t.id === tid ? fn(t) : t)),
  }))
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "select":
      return { ...state, selectedId: action.id }
    case "toggleTask":
      return mapTask(state, action.pid, action.tid, (t) => ({
        ...t,
        completed: !t.completed,
        due: t.completed ? "Due today" : `Completed ${nowTime()}`,
      }))
    case "setUrgency":
      return mapTask(state, action.pid, action.tid, (t) => ({ ...t, urgency: action.urgency }))
    case "deleteTask":
      return mapPatient(state, action.pid, (p) => ({
        ...p,
        tasks: p.tasks.filter((t) => t.id !== action.tid),
      }))
    case "addTasks":
      return mapPatient(state, action.pid, (p) => ({ ...p, tasks: [...p.tasks, ...action.tasks] }))
    case "addPatient":
      return {
        ...state,
        patients: [...state.patients, action.patient],
        selectedId: action.patient.id,
      }
    case "dischargePatient": {
      const patients = state.patients.filter((p) => p.id !== action.pid)
      return {
        ...state,
        patients,
        selectedId:
          state.selectedId === action.pid ? (patients[0]?.id ?? "") : state.selectedId,
      }
    }
    case "updateRounds":
      return mapPatient(state, action.pid, (p) => ({
        ...p,
        transcript: action.transcript,
        notes: action.notes,
      }))
    case "appendTranscript":
      return mapPatient(state, action.pid, (p) => ({
        ...p,
        transcript: p.transcript.trim() ? `${p.transcript.trimEnd()} ${action.text}` : action.text,
      }))
    case "applyRounds": {
      const done = new Set(action.complete)
      const urg = new Map(action.urgency.map((u) => [u.taskId, u.urgency]))
      const time = nowTime()
      return mapPatient(state, action.pid, (p) => ({
        ...p,
        summary: action.summary.engine === "claude" ? action.summary.summary : p.summary,
        detected: action.summary.engine === "claude" && action.summary.findings.length ? action.summary.findings : p.detected,
        roundedAt: time,
        tasks: [
          ...p.tasks.map((t) =>
            done.has(t.id)
              ? { ...t, completed: true, due: `Completed ${time}` }
              : urg.has(t.id)
                ? { ...t, urgency: urg.get(t.id)! }
                : t,
          ),
          ...action.tasks,
        ],
      }))
    }
    case "aiConfig":
      return { ...state, ai: { ...state.ai, ...action.ai } }
    case "markRounded":
      return mapPatient(state, action.pid, (p) => ({ ...p, roundedAt: nowTime() }))
    case "sendReferral":
      return mapPatient(state, action.pid, (p) => ({
        ...p,
        snf: p.snf ? { ...p.snf, referralSentTo: action.facility } : p.snf,
      }))
    case "sendMessage":
      return {
        ...state,
        threads: state.threads.map((th) =>
          th.id === action.threadId
            ? {
                ...th,
                unread: action.from === "them",
                messages: [...th.messages, { from: action.from, text: action.text, time: nowTime() }],
              }
            : th,
        ),
      }
    case "startThread":
      return { ...state, threads: [action.thread, ...state.threads] }
    case "readThread":
      return {
        ...state,
        threads: state.threads.map((th) =>
          th.id === action.threadId ? { ...th, unread: false } : th,
        ),
      }
    case "setting":
      return { ...state, settings: { ...state.settings, [action.key]: action.value } }
    case "signOut":
      return { ...state, signedIn: false }
    case "signIn":
      return { ...state, signedIn: true }
    case "reset":
      // Keep the AI connection when demo data is reset.
      return { ...initialState(), ai: state.ai }
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as State
      if (parsed.version === VERSION) return { ...parsed, ai: { ...defaultAiSettings, ...parsed.ai } }
    }
  } catch {
    // storage unavailable or corrupt: fall back to seed data
  }
  return initialState()
}

type Store = {
  state: State
  dispatch: (action: Action) => void
  toast: string | null
  notify: (message: string) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // ignore: the app still works without persistence
    }
  }, [state])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const notify = useCallback((message: string) => setToast(message), [])

  return (
    <StoreContext.Provider value={{ state, dispatch, toast, notify }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error("useStore must be used inside StoreProvider")
  return store
}

export function usePatient(id?: string) {
  const { state } = useStore()
  return (
    state.patients.find((p) => p.id === (id ?? state.selectedId)) ?? state.patients[0]
  )
}

// Hash routing keeps every page working on GitHub Pages without server rewrites.
export function useRoute() {
  const read = () => {
    const hash = window.location.hash.replace(/^#/, "") || "/"
    return hash.split("?")[0]
  }
  const [path, setPath] = useState(read)
  useEffect(() => {
    const onChange = () => {
      setPath(read())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return path
}

export function navigate(path: string) {
  window.location.hash = path
}
