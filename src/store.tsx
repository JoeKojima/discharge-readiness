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
  agKeys,
  seedPatients,
  type Assessment,
  seedThreads,
  type Patient,
  type Task,
  type Thread,
  type Urgency,
} from "./data"
import { clockTime, nowTime } from "./logic"
import { playbooks } from "./automation"
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

// 3: summary became dot points and patients gained an A–G assessment.
const VERSION = 3
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
  | { type: "automationStart"; pid: string; tid: string }
  | { type: "automationResolve"; pid: string; tid: string; outcome: "success" | "fallback"; timedOut?: boolean }
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
        due: t.completed ? (t.openDue ?? "Due today") : `Completed ${nowTime()}`,
        openDue: t.completed ? undefined : t.due,
      }))
    case "automationStart": {
      return mapTask(state, action.pid, action.tid, (t) => {
        const pb = playbooks.find((p) => p.match.test(t.title))
        if (!pb || t.completed) return t
        const time = nowTime()
        return {
          ...t,
          automation: {
            playbook: pb.id,
            state: "waiting",
            deadline: new Date(Date.now() + pb.timeoutMin * 60_000).toISOString(),
            log: [...pb.steps(t).map((text) => ({ time, text })), { time, text: pb.waitFor }],
          },
        }
      })
    }
    case "automationResolve": {
      return mapTask(state, action.pid, action.tid, (t) => {
        const run = t.automation
        const pb = playbooks.find((p) => p.id === run?.playbook)
        if (!run || !pb || run.state !== "waiting") return t
        const time = nowTime()
        if (action.outcome === "success")
          return {
            ...t,
            completed: true,
            openDue: t.due,
            due: `Completed ${time}`,
            automation: { ...run, state: "done", log: [...run.log, { time, text: pb.successLog }] },
          }
        const soon = new Date(Date.now() + 30 * 60_000)
        return {
          ...t,
          owner: pb.escalateTo,
          urgency: "High",
          due: `Due by ${clockTime(soon)}`,
          automation: {
            ...run,
            state: "escalated",
            escalatedFrom: t.owner,
            log: [
              ...run.log,
              {
                time,
                text: action.timedOut
                  ? `No response in ${pb.timeoutMin} min, so the task was handed to ${pb.escalateTo === "JMO" ? "the JMO task list" : pb.escalateTo}`
                  : pb.escalateLog,
              },
            ],
          },
        }
      })
    }
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
        // One finished phrase per line, so the summarizer can tell statements apart.
        transcript: p.transcript.trim() ? `${p.transcript.trimEnd()}\n${action.text}` : action.text,
      }))
    case "applyRounds": {
      const done = new Set(action.complete)
      const urg = new Map(action.urgency.map((u) => [u.taskId, u.urgency]))
      const time = nowTime()
      return mapPatient(state, action.pid, (p) => ({
        ...p,
        // The summary is the record of the round; the raw transcript isn't kept.
        summary: action.summary.summary,
        // Letters not covered this round keep their previous finding.
        assessment: Object.fromEntries(
          agKeys.map((k) => [k, action.summary.assessment[k].trim() || p.assessment[k]]),
        ) as Assessment,
        detected: action.summary.findings.length ? action.summary.findings : p.detected,
        outlook: action.summary.outlook,
        transcript: "",
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
      const ai = { ...defaultAiSettings, ...parsed.ai }
      if (parsed.version === VERSION) return { ...parsed, ai }
      // Older saved data uses a different shape: start from fresh demo data but keep the AI connection.
      return { ...initialState(), ai }
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
