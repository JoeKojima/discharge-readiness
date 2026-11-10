import { useEffect, useMemo, useRef, useState } from "react"

type IconName = "activity" | "alert" | "arrow" | "bed" | "building" | "calendar" | "check" | "chevron" | "clock" | "close" | "document" | "dollar" | "home" | "logout" | "menu" | "message" | "more" | "patients" | "plus" | "search" | "settings" | "shield" | "sparkles" | "stethoscope" | "user"

const paths: Record<IconName, React.ReactNode> = {
  activity: (
    <>
      <path d="M3 12h4l2.2-6 4.2 12 2.2-6H21" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4m0 3h.01" />
    </>
  ),
  arrow: (
    <>
      <path d="m9 18 6-6-6-6" />
    </>
  ),
  bed: (
    <>
      <path d="M3 4v16m0-5h18v5M6 8h5a3 3 0 0 1 3 3v4H3V11a3 3 0 0 1 3-3Zm8 3h3a4 4 0 0 1 4 4" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5l8-3 8 3v16M2 21h20M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  document: (
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5M9 13h6M9 17h6" />
    </>
  ),
  dollar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M16 8.5c-.8-1-2-1.5-4-1.5-2.2 0-3.5 1-3.5 2.5 0 3.8 7 1.5 7 5.2 0 1.4-1.2 2.3-3.5 2.3-1.8 0-3.2-.5-4-1.6M12 5v14" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  message: (
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  patients: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 7a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 4v1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3 7.7 7.5 9.5 4.5-1.8 7.5-5 7.5-9.5V6z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2ZM19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7ZM5 14l.7 1.3L7 16l-1.3.7L5 18l-.7-1.3L3 16l1.3-.7Z" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M6 3v5a5 5 0 0 0 10 0V3M4 3h4M14 3h4M11 13v2a5 5 0 0 0 10 0v-1" />
      <circle cx="21" cy="12" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
}

function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

type Task = {
  id: number
  title: string
  detail: string
  owner: string
  due: string
  urgency: "High" | "Medium" | "Low"
  effort: string
  completed: boolean
  category: string
}

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Confirm home oxygen delivery",
    detail: "Verify concentrator delivery window and backup tank availability.",
    owner: "Case Management",
    due: "Due in 45 min",
    urgency: "High",
    effort: "20 min",
    completed: false,
    category: "Coordination",
  },
  {
    id: 2,
    title: "Complete medication reconciliation",
    detail: "Review anticoagulant dosing and remove duplicate PRN orders.",
    owner: "Dr. Chen",
    due: "Due by 11:30 AM",
    urgency: "High",
    effort: "15 min",
    completed: false,
    category: "Clinical",
  },
  {
    id: 3,
    title: "Patient ambulation assessment",
    detail: "Document 50 ft walk with SpO₂ above 90% on 2L nasal cannula.",
    owner: "Physical Therapy",
    due: "Due by 1:00 PM",
    urgency: "Medium",
    effort: "30 min",
    completed: false,
    category: "Clinical",
  },
  {
    id: 4,
    title: "Schedule pulmonary follow-up",
    detail: "Book outpatient visit within 7–10 days of discharge.",
    owner: "Unit Coordinator",
    due: "Due today",
    urgency: "Medium",
    effort: "10 min",
    completed: false,
    category: "Follow-up",
  },
  {
    id: 5,
    title: "Review inhaler technique",
    detail: "Teach-back completed with patient and daughter present.",
    owner: "Respiratory Therapy",
    due: "Completed 9:20 AM",
    urgency: "Low",
    effort: "15 min",
    completed: true,
    category: "Education",
  },
  {
    id: 6,
    title: "Finalize discharge summary",
    detail: "Hospital course and pending lab guidance documented.",
    owner: "Dr. Chen",
    due: "Completed 8:45 AM",
    urgency: "Low",
    effort: "20 min",
    completed: true,
    category: "Documentation",
  },
]

type TaskTemplate = Omit<Task, "id" | "completed">

// Rule-based extraction: each rule maps phrases found in the rounds
// transcript / clinical notes to a checklist task. Runs fully in the browser.
const extractionRules: { pattern: RegExp; task: TaskTemplate }[] = [
  {
    pattern: /oxygen|\bo2\b|concentrator|nasal cannula/,
    task: initialTasks[0],
  },
  {
    pattern: /medication rec|reconcil|anticoag|dosing|duplicate (prn|order)/,
    task: initialTasks[1],
  },
  {
    pattern: /\bpt\b|physical therap|walk|ambulat|mobility/,
    task: initialTasks[2],
  },
  {
    pattern: /follow[- ]?up|pulmonolog|clinic visit|appointment/,
    task: initialTasks[3],
  },
  {
    pattern: /inhaler|teach[- ]?back/,
    task: initialTasks[4],
  },
  {
    pattern: /discharge summary/,
    task: initialTasks[5],
  },
  {
    pattern: /pick (him|her|them)? ?up|transport|ride home|drive (him|her|them) home/,
    task: {
      title: "Verify caregiver transport plan",
      detail: "Confirm who is picking the patient up and the pickup time at bedside.",
      owner: "Case Management",
      due: "Due by 2:30 PM",
      urgency: "Medium",
      effort: "5 min",
      category: "Coordination",
    },
  },
  {
    pattern: /walker|wheelchair|commode|hospital bed|\bcane\b|shower chair/,
    task: {
      title: "Order durable medical equipment",
      detail: "Place DME order and confirm delivery before discharge.",
      owner: "Case Management",
      due: "Due today",
      urgency: "High",
      effort: "15 min",
      category: "Coordination",
    },
  },
  {
    pattern: /home health|visiting nurse|nursing visit/,
    task: {
      title: "Arrange home health referral",
      detail: "Send referral and confirm start-of-care date with the agency.",
      owner: "Case Management",
      due: "Due today",
      urgency: "Medium",
      effort: "15 min",
      category: "Coordination",
    },
  },
  {
    pattern: /prescription|pharmacy|meds to beds|\brx\b/,
    task: {
      title: "Send discharge prescriptions",
      detail: "E-prescribe new medications and confirm pharmacy coverage.",
      owner: "Dr. Chen",
      due: "Due by 12:00 PM",
      urgency: "High",
      effort: "10 min",
      category: "Clinical",
    },
  },
  {
    pattern: /\blabs?\b|bloodwork|cultures? pending|pending results/,
    task: {
      title: "Arrange outpatient lab follow-up",
      detail: "Order post-discharge labs and assign who reviews pending results.",
      owner: "Dr. Chen",
      due: "Due today",
      urgency: "Medium",
      effort: "10 min",
      category: "Follow-up",
    },
  },
  {
    pattern: /smok|tobacco|nicotine/,
    task: {
      title: "Offer smoking cessation counseling",
      detail: "Discuss cessation resources and nicotine replacement options.",
      owner: "Respiratory Therapy",
      due: "Due today",
      urgency: "Low",
      effort: "10 min",
      category: "Education",
    },
  },
  {
    pattern: /diet|nutrition|low[- ]sodium|diabet/,
    task: {
      title: "Provide dietary education",
      detail: "Review discharge diet with patient and caregiver using teach-back.",
      owner: "Nursing",
      due: "Due today",
      urgency: "Low",
      effort: "10 min",
      category: "Education",
    },
  },
  {
    pattern: /fall risk|stairs|home safety|lives alone/,
    task: {
      title: "Complete home safety review",
      detail: "Assess fall risk, stairs at home, and caregiver support.",
      owner: "Physical Therapy",
      due: "Due today",
      urgency: "Medium",
      effort: "15 min",
      category: "Clinical",
    },
  },
  {
    pattern: /prior auth|authorization|snf|skilled nursing|rehab facility/,
    task: {
      title: "Submit prior authorization",
      detail: "Send clinicals to payer for post-acute placement approval.",
      owner: "Case Management",
      due: "Due today",
      urgency: "High",
      effort: "20 min",
      category: "Coordination",
    },
  },
]

const urgencyRank = { High: 0, Medium: 1, Low: 2 } as const

function parseMinutes(effort: string) {
  const value = parseInt(effort, 10)
  return Number.isFinite(value) ? value : 0
}

function formatMinutes(total: number) {
  if (total === 0) return "0m"
  const h = Math.floor(total / 60)
  const m = total % 60
  return h ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`
}

const defaultTranscript =
  "Patient feels much better today. Breathing comfortably on two liters. Daughter confirmed she can pick him up after three, but we are still waiting to hear from the oxygen company. Please have PT walk him once more before lunch. Review the new inhaler with both patient and daughter."

const defaultNotes =
  "COPD exacerbation improving. SpO₂ 93% on 2L NC. Medically stable pending DME and mobility clearance."

const patients = [
  {
    initials: "JM",
    name: "James Miller",
    meta: "68 M · MRN 204918",
    room: "4W · 412",
    readiness: 72,
    color: "#d7e6ff",
  },
  {
    initials: "EP",
    name: "Elena Park",
    meta: "54 F · MRN 189442",
    room: "4W · 408",
    readiness: 88,
    color: "#e8ddff",
  },
  {
    initials: "RB",
    name: "Robert Brown",
    meta: "73 M · MRN 227103",
    room: "4W · 416",
    readiness: 46,
    color: "#ffe4d7",
  },
  {
    initials: "AS",
    name: "Amina Shah",
    meta: "61 F · MRN 199327",
    room: "4W · 421",
    readiness: 91,
    color: "#d5f3e6",
  },
]

const navItems: { label: string; icon: IconName; count?: number }[] = [
  { label: "Overview", icon: "home" },
  { label: "My patients", icon: "patients", count: 8 },
  { label: "Tasks", icon: "check", count: 14 },
  { label: "Rounds", icon: "stethoscope" },
  { label: "Messages", icon: "message", count: 3 },
]

const facilities = [
  {
    name: "Harborview Post-Acute",
    distance: "2.8 miles",
    match: 94,
    rank: "Best clinical fit",
    availability: "Bed available today",
    patientCost: "$350",
    payerCost: "$8,680",
    hospitalCost: "$185",
    delayCost: "$0",
    specialties: ["Bariatric care", "Respiratory therapy", "Anticoagulation"],
    barrier: "Requires 24 hours restraint-free",
    note: "On-site respiratory therapy 7 days/week and bariatric equipment confirmed.",
  },
  {
    name: "Greenfield Skilled Nursing",
    distance: "5.1 miles",
    match: 86,
    rank: "Lowest patient cost",
    availability: "Bed in 1–2 days",
    patientCost: "$210",
    payerCost: "$7,560",
    hospitalCost: "$95",
    delayCost: "$2,450",
    specialties: ["Bariatric care", "Wound care", "Rehabilitation"],
    barrier: "Requires 48 hours restraint-free",
    note: "Preferred insurance tier, but respiratory therapy is available weekdays only.",
  },
  {
    name: "Riverside Rehabilitation",
    distance: "4.4 miles",
    match: 78,
    rank: "Alternate option",
    availability: "Bed available today",
    patientCost: "$1,260",
    payerCost: "$7,070",
    hospitalCost: "$140",
    delayCost: "$0",
    specialties: ["Pulmonary rehab", "Pharmacy on-site", "Mobility"],
    barrier: "Out-of-network benefit applies",
    note: "Strong pulmonary program; bariatric bed requires final equipment confirmation.",
  },
]

function ProgressRing({ value }: { value: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative grid h-[132px] w-[132px] place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e8eeec"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#167a5b"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <div className="text-center">
        <div className="text-[30px] font-semibold tracking-tight text-[#133c33]">
          {value}%
        </div>
        <div className="text-[11px] font-medium text-slate-500">READY</div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeNav, setActiveNav] = useState("Overview")
  const [activePatient, setActivePatient] = useState(0)
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<"All tasks" | "Open" | "Completed">(
    "All tasks",
  )
  const [showGenerator, setShowGenerator] = useState(false)
  const [showPatients, setShowPatients] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedFacility, setSelectedFacility] = useState(0)
  const [transcript, setTranscript] = useState(defaultTranscript)
  const [notes, setNotes] = useState(defaultNotes)
  const [addedTitles, setAddedTitles] = useState<string[]>([])
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<number | null>(null)
  const patientMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPatients) return
    const close = (event: MouseEvent) => {
      if (!patientMenuRef.current?.contains(event.target as Node)) {
        setShowPatients(false)
      }
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [showPatients])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowGenerator(false)
        setShowPatients(false)
        setMobileNav(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filteredTasks = useMemo(
    () =>
      tasks
        .filter((task) => {
          const matchesFilter =
            filter === "All tasks" ||
            (filter === "Completed" ? task.completed : !task.completed)
          const query = search.toLowerCase()
          return (
            matchesFilter &&
            (task.title.toLowerCase().includes(query) ||
              task.detail.toLowerCase().includes(query) ||
              task.owner.toLowerCase().includes(query))
          )
        })
        .sort(
          (a, b) =>
            Number(a.completed) - Number(b.completed) ||
            urgencyRank[a.urgency] - urgencyRank[b.urgency],
        ),
    [tasks, filter, search],
  )

  const completed = tasks.filter((task) => task.completed).length
  const readiness = Math.min(100, 58 + completed * 7)
  const patient = patients[activePatient]
  const openEffort = tasks
    .filter((task) => !task.completed)
    .reduce((sum, task) => sum + parseMinutes(task.effort), 0)
  const blocker =
    tasks.find((task) => !task.completed && task.urgency === "High") ??
    tasks.find((task) => !task.completed)

  const openGenerator = () => {
    setAddedTitles([])
    setGenerated(false)
    setShowGenerator(true)
  }

  const viewTask = (id: number) => {
    setFilter("All tasks")
    setSearch("")
    setHighlightId(id)
    window.setTimeout(() => {
      document
        .getElementById(`task-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 50)
    window.setTimeout(() => setHighlightId(null), 1700)
  }

  const toggleTask = (id: number) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              due: !task.completed ? "Completed just now" : "Due today",
            }
          : task,
      ),
    )
  }

  const generateChecklist = () => {
    setGenerating(true)
    const text = `${transcript}\n${notes}`.toLowerCase()
    window.setTimeout(() => {
      const existing = new Set(tasks.map((task) => task.title))
      const newTasks: Task[] = extractionRules
        .filter(
          (rule) => rule.pattern.test(text) && !existing.has(rule.task.title),
        )
        .map((rule, index) => ({
          ...rule.task,
          id: Date.now() + index,
          completed: false,
        }))
      setTasks((current) => [...current, ...newTasks])
      setAddedTitles(newTasks.map((task) => task.title))
      setGenerating(false)
      setGenerated(true)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#f3f6f5] text-[#1d2f2b]">
      {mobileNav && (
        <div
          className="fixed inset-0 z-40 bg-[#112d27]/35 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 w-[238px] flex-col border-r border-[#dfe7e4] bg-[#f9fbfa] lg:z-30 lg:flex ${
          mobileNav ? "z-50 flex shadow-2xl" : "hidden"
        }`}
      >
        <div className="flex h-[78px] items-center gap-3 border-b border-[#e7ecea] px-6">
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#126b51] text-white">
            <Icon name="activity" size={21} />
          </div>
          <div>
            <div className="text-[17px] font-semibold tracking-[-0.03em] text-[#163d34]">
              ClearPath
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[.16em] text-[#79908a]">
              Clinical workflow
            </div>
          </div>
        </div>
        <div className="px-4 pt-6">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.13em] text-[#82918d]">
            Workspace
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setActiveNav(item.label)
                  setMobileNav(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  activeNav === item.label
                    ? "bg-[#e4f1ed] text-[#126b51]"
                    : "text-[#60716d] hover:bg-[#eef3f1] hover:text-[#284b42]"
                }`}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
                {item.count && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] ${
                      activeNav === item.label ? "bg-white/70" : "bg-[#e8eeec]"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto px-4 pb-5">
          <div className="mb-4 rounded-2xl border border-[#dce8e3] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-[#126b51]">
              <Icon name="sparkles" size={16} />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                AI rounds assistant
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#687b76]">
              Last ambient sync completed 6 minutes ago.
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#e5ece9]">
              <div className="h-full w-full rounded-full bg-[#35a881]" />
            </div>
          </div>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-[#60716d] hover:bg-[#eef3f1]">
            <Icon name="settings" size={18} />
            Settings
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-[#60716d] hover:bg-[#eef3f1]">
            <Icon name="logout" size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-[238px]">
        <header className="sticky top-0 z-20 flex h-[78px] items-center border-b border-[#e0e7e4] bg-[#f9fbfa]/95 px-4 backdrop-blur md:px-7 lg:px-9">
          <button
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
            className="mr-3 rounded-lg p-2 text-slate-600 lg:hidden"
          >
            <Icon name="menu" />
          </button>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#81918c]">
              Wednesday, June 18
            </p>
            <h1 className="mt-0.5 text-[18px] font-semibold tracking-[-.025em] text-[#173d34]">
              Good morning, Dr. Chen
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <button
              onClick={openGenerator}
              className="hidden items-center gap-2 rounded-xl bg-[#156d53] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(21,109,83,.18)] transition hover:bg-[#105b45] sm:flex"
            >
              <Icon name="sparkles" size={16} />
              Generate checklist
            </button>
            <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#dce5e2] bg-white text-[#556a64] hover:bg-[#f2f6f4]">
              <Icon name="message" size={17} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#d75544]" />
            </button>
            <div className="ml-1 grid h-10 w-10 place-items-center rounded-xl bg-[#d9e7ff] text-[12px] font-semibold text-[#31527c]">
              LC
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-7 lg:px-9 lg:py-8">
          <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#6e807b]">
                <span>My patients</span>
                <Icon name="chevron" size={12} />
                <span className="text-[#184f41]">Discharge readiness</span>
              </div>
              <h2 className="text-[27px] font-semibold tracking-[-.04em] text-[#173b33]">
                Discharge command center
              </h2>
              <p className="mt-1 text-[13px] text-[#70807c]">
                AI-prioritized actions from rounds, notes, and the care team.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openGenerator}
                className="flex items-center gap-2 rounded-xl bg-[#156d53] px-4 py-2.5 text-[12px] font-semibold text-white sm:hidden"
              >
                <Icon name="sparkles" size={16} />
                Generate
              </button>
              <div className="relative" ref={patientMenuRef}>
              <button
                onClick={() => setShowPatients(!showPatients)}
                aria-haspopup="listbox"
                aria-expanded={showPatients}
                className="flex min-w-[205px] items-center gap-3 rounded-xl border border-[#d9e3e0] bg-white px-3 py-2.5 text-left shadow-sm hover:border-[#b9ccc6]"
              >
                <div
                  className="grid h-8 w-8 place-items-center rounded-lg text-[10px] font-bold text-[#234a40]"
                  style={{ background: patient.color }}
                >
                  {patient.initials}
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-[#29453e]">
                    {patient.name}
                  </div>
                  <div className="text-[10px] text-[#81908c]">
                    {patient.room}
                  </div>
                </div>
                <Icon
                  name="chevron"
                  size={14}
                  className="ml-auto rotate-90 text-[#84928e]"
                />
              </button>
                {showPatients && (
                  <div
                    role="listbox"
                    className="absolute right-0 top-[54px] z-30 w-[275px] rounded-2xl border border-[#dce5e2] bg-white p-2 shadow-xl"
                  >
                    {patients.map((p, index) => (
                      <button
                        key={p.name}
                        role="option"
                        aria-selected={index === activePatient}
                        onClick={() => {
                          setActivePatient(index)
                          setShowPatients(false)
                        }}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 text-left hover:bg-[#f0f5f3] ${
                          index === activePatient ? "bg-[#f4f8f6]" : ""
                        }`}
                      >
                        <div
                          className="grid h-9 w-9 place-items-center rounded-lg text-[10px] font-bold"
                          style={{ background: p.color }}
                        >
                          {p.initials}
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{p.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {p.meta}
                          </div>
                        </div>
                        <span className="ml-auto text-xs font-semibold text-[#187158]">
                          {p.readiness}%
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mb-5 grid gap-4 xl:grid-cols-[1.5fr_.72fr_.72fr]">
            <div className="relative overflow-hidden rounded-[18px] border border-[#dbe5e1] bg-white p-5 shadow-[0_2px_5px_rgba(30,65,55,.03)] md:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <ProgressRing value={readiness} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[19px] font-semibold tracking-[-.025em] text-[#183d34]">
                      {patient.name}
                    </h3>
                    <span className="rounded-full bg-[#fff0d6] px-2.5 py-1 text-[10px] font-semibold text-[#9a6217]">
                      Likely discharge today
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#758681]">
                    {patient.meta}{" "}
                    <span className="mx-1.5 text-[#c0cbc8]">|</span> COPD
                    exacerbation{" "}
                    <span className="mx-1.5 text-[#c0cbc8]">|</span> LOS 3d
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-4 border-t border-[#edf1ef] pt-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[#85928f]">
                        Open tasks
                      </p>
                      <p className="mt-1 text-[18px] font-semibold text-[#253f39]">
                        {tasks.length - completed}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[#85928f]">
                        Est. effort
                      </p>
                      <p className="mt-1 text-[18px] font-semibold text-[#253f39]">
                        {formatMinutes(openEffort)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[#85928f]">
                        Target
                      </p>
                      <p className="mt-1 text-[18px] font-semibold text-[#253f39]">
                        3:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#e8f6f1]/70" />
            </div>
            {blocker ? (
              <div className="rounded-[18px] border border-[#f0d6ce] bg-[#fffaf8] p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#fde7e1] text-[#bf5946]">
                    <Icon name="alert" size={18} />
                  </div>
                  <span className="rounded-full bg-[#f8ded7] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#ae4d3d]">
                    Attention
                  </span>
                </div>
                <p className="mt-4 text-[11px] font-medium text-[#8a716b]">
                  Primary blocker
                </p>
                <p className="mt-1 text-[14px] font-semibold leading-snug text-[#503d38]">
                  {blocker.title}
                </p>
                <button
                  onClick={() => viewTask(blocker.id)}
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
                <p className="mt-4 text-[11px] font-medium text-[#658078]">
                  Primary blocker
                </p>
                <p className="mt-1 text-[14px] font-semibold leading-snug text-[#205c4c]">
                  No open blockers — ready for discharge
                </p>
              </div>
            )}
            <div className="rounded-[18px] border border-[#dce5e2] bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e2f1ec] text-[#16745a]">
                  <Icon name="clock" size={18} />
                </div>
                <Icon name="more" size={18} className="text-[#91a09c]" />
              </div>
              <p className="mt-4 text-[11px] font-medium text-[#788985]">
                Discharge confidence
              </p>
              <p className="mt-1 text-[14px] font-semibold text-[#29463f]">
                Moderate, trending up
              </p>
              <div className="mt-4 flex items-end gap-1">
                {[5, 7, 6, 9, 11, 13, 15, 18].map((h, i) => (
                  <span
                    key={i}
                    className="w-full rounded-sm bg-[#b9dfd2]"
                    style={{ height: h }}
                  />
                ))}
              </div>
              <p className="mt-2 text-[10px] text-[#84938f]">
                +12% since morning rounds
              </p>
            </div>
          </section>

          <section className="mb-5 overflow-hidden rounded-[18px] border border-[#cfe0da] bg-white shadow-[0_2px_8px_rgba(30,65,55,.04)]">
            <div className="grid lg:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center md:px-6">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#dcefe8] text-[#176b54]">
                  <Icon name="building" size={21} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#197158]">
                      SNF placement recommendation
                    </p>
                    <span className="rounded-full bg-[#e6f2ee] px-2 py-0.5 text-[8px] font-semibold text-[#176b54]">
                      3 facilities matched
                    </span>
                  </div>
                  <h3 className="mt-1 text-[15px] font-semibold tracking-[-.02em] text-[#23483e]">
                    Harborview Post-Acute is the best equipped option
                  </h3>
                  <p className="mt-1 text-[10px] leading-relaxed text-[#71837d]">
                    94% clinical match · Bariatric and respiratory support ·
                    Bed available today · Estimated patient cost $350
                  </p>
                </div>
                <button
                  onClick={() =>
                    document
                      .getElementById("snf-recommendations")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#176b54] px-4 py-2.5 text-[10px] font-semibold text-white hover:bg-[#105b45]"
                >
                  Compare facilities
                  <Icon name="arrow" size={13} />
                </button>
              </div>
              <div className="grid grid-cols-3 border-t border-[#e2e9e6] bg-[#f8fbfa] lg:w-[390px] lg:border-l lg:border-t-0">
                <div className="flex flex-col justify-center border-r border-[#e2e9e6] px-4 py-3">
                  <p className="text-[8px] uppercase tracking-[.08em] text-[#8a9894]">
                    Patient cost
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[#29463f]">
                    $350
                  </p>
                  <p className="text-[8px] text-[#8a9894]">14-day estimate</p>
                </div>
                <div className="flex flex-col justify-center border-r border-[#e2e9e6] px-4 py-3">
                  <p className="text-[8px] uppercase tracking-[.08em] text-[#8a9894]">
                    Entry barrier
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[#a45440]">
                    24 hrs
                  </p>
                  <p className="text-[8px] text-[#8a9894]">restraint-free</p>
                </div>
                <div className="flex flex-col justify-center px-4 py-3">
                  <p className="text-[8px] uppercase tracking-[.08em] text-[#8a9894]">
                    Hospital delay
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[#176b54]">
                    $0
                  </p>
                  <p className="text-[8px] text-[#8a9894]">bed available</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_305px]">
            <div className="overflow-hidden rounded-[18px] border border-[#dbe4e1] bg-white">
              <div className="border-b border-[#e7ecea] px-5 pt-5 md:px-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-[16px] font-semibold tracking-[-.02em] text-[#1b4037]">
                      Readiness checklist
                    </h3>
                    <p className="mt-0.5 text-[11px] text-[#82908d]">
                      {completed} of {tasks.length} tasks complete · Sorted by
                      clinical priority
                    </p>
                  </div>
                  <div className="relative">
                    <Icon
                      name="search"
                      size={14}
                      className="absolute left-3 top-2.5 text-[#8a9995]"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search tasks"
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
                        filter === item
                          ? "border-[#197158] text-[#176b54]"
                          : "border-transparent text-[#8a9794] hover:text-[#536a64]"
                      }`}
                    >
                      {item}
                      {item === "Open" && (
                        <span className="ml-1.5 rounded-full bg-[#ecf1ef] px-1.5 py-0.5 text-[9px]">
                          {tasks.length - completed}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-[#edf1ef]">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    id={`task-${task.id}`}
                    className={`group flex scroll-mt-24 gap-3 px-5 py-4 transition hover:bg-[#fafcfb] md:px-6 ${
                      task.completed ? "opacity-60" : ""
                    } ${highlightId === task.id ? "flash-highlight" : ""}`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      aria-label={
                        task.completed ? "Mark incomplete" : "Mark complete"
                      }
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
                        task.completed
                          ? "border-[#25866a] bg-[#25866a] text-white"
                          : "border-[#b8c6c2] bg-white hover:border-[#25866a]"
                      }`}
                    >
                      {task.completed && <Icon name="check" size={13} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4
                              className={`text-[13px] font-semibold text-[#29463f] ${
                                task.completed ? "line-through" : ""
                              }`}
                            >
                              {task.title}
                            </h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                task.urgency === "High"
                                  ? "bg-[#fde5df] text-[#b64f3c]"
                                  : task.urgency === "Medium"
                                    ? "bg-[#fff0d3] text-[#976216]"
                                    : "bg-[#e7f1ee] text-[#55746b]"
                              }`}
                            >
                              {task.urgency}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-[#7a8985]">
                            {task.detail}
                          </p>
                        </div>
                        <button className="hidden rounded-lg p-1.5 text-[#90a09c] hover:bg-[#edf2f0] md:block">
                          <Icon name="more" size={17} />
                        </button>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#7e8e89]">
                        <span className="flex items-center gap-1.5">
                          <Icon name="user" size={12} />
                          {task.owner}
                        </span>
                        <span
                          className={`flex items-center gap-1.5 ${
                            task.urgency === "High" && !task.completed
                              ? "font-medium text-[#b75a48]"
                              : ""
                          }`}
                        >
                          <Icon name="clock" size={12} />
                          {task.due}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Icon name="activity" size={12} />
                          {task.effort} effort
                        </span>
                        <span className="rounded bg-[#f1f4f3] px-1.5 py-0.5">
                          {task.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTasks.length === 0 && (
                  <div className="py-14 text-center text-sm text-[#81908c]">
                    No tasks match this view.
                  </div>
                )}
              </div>
              <button
                onClick={openGenerator}
                className="flex w-full items-center justify-center gap-2 border-t border-[#e7ecea] py-3.5 text-[11px] font-semibold text-[#197158] hover:bg-[#f4f8f6]"
              >
                <Icon name="plus" size={15} />
                Add from rounds notes
              </button>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[18px] border border-[#d8e5e1] bg-[#f7fbf9] p-5">
                <div className="flex items-center gap-2 text-[#176b54]">
                  <Icon name="sparkles" size={17} />
                  <h3 className="text-[12px] font-semibold">
                    AI clinical summary
                  </h3>
                  <span className="ml-auto text-[9px] text-[#82938e]">
                    6m ago
                  </span>
                </div>
                <p className="mt-4 text-[12px] leading-[1.7] text-[#526a64]">
                  Patient is clinically improved on 2L oxygen and eager to
                  return home. Discharge depends on durable medical equipment
                  confirmation and safe ambulation.
                </p>
                <div className="my-4 border-t border-[#dfe9e5]" />
                <p className="text-[10px] font-semibold uppercase tracking-[.09em] text-[#85938f]">
                  Detected in rounds
                </p>
                <ul className="mt-3 space-y-2.5">
                  {[
                    "Daughter can provide transport after 3 PM",
                    "No new dyspnea overnight",
                    "Patient has 14-day medication supply",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-[11px] leading-snug text-[#506761]"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#48a98c]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={openGenerator}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#cfe1db] bg-white py-2.5 text-[11px] font-semibold text-[#176b54] hover:bg-[#edf6f2]"
                >
                  <Icon name="document" size={14} />
                  Review source data
                </button>
              </div>
              <div className="rounded-[18px] border border-[#dce5e2] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-semibold text-[#29463f]">
                    Care team
                  </h3>
                  <button className="text-[10px] font-semibold text-[#197158]">
                    View all
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ["LC", "Dr. Lena Chen", "Attending"],
                    ["MR", "Maya Rodriguez", "Case manager"],
                    ["TH", "Tom Hayes", "Physical therapy"],
                  ].map(([avatar, name, role], index) => (
                    <div className="flex items-center gap-3" key={name}>
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-lg text-[9px] font-bold ${
                          index === 0
                            ? "bg-[#dce9ff] text-[#38567c]"
                            : index === 1
                              ? "bg-[#e6ddfa] text-[#5d4a7e]"
                              : "bg-[#dcefe8] text-[#366556]"
                        }`}
                      >
                        {avatar}
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#3d554f]">
                          {name}
                        </p>
                        <p className="text-[9px] text-[#8a9894]">{role}</p>
                      </div>
                      <span className="ml-auto h-2 w-2 rounded-full bg-[#4ab18f]" />
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>

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
                      3 matched
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#7e8e89]">
                    Ranked by clinical capability, admission likelihood,
                    insurance coverage, and total transition cost.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-[#dce5e2] bg-[#f9fbfa] px-3.5 py-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[#567169] shadow-sm">
                  <Icon name="shield" size={15} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[.09em] text-[#879590]">
                    Coverage
                  </p>
                  <p className="text-[11px] font-semibold text-[#365149]">
                    Aetna Medicare Advantage PPO
                  </p>
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
                    <p className="text-[11px] font-semibold text-[#334f47]">
                      Potential admission barriers
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#889691]">
                      Identified from the chart and rounds transcript
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fde6df] px-2 py-1 text-[9px] font-bold text-[#aa4d3d]">
                    1 high priority
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 rounded-xl border border-[#f0d5ce] bg-[#fff9f7] p-3">
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#fbe4de] text-[#b25040]">
                      <Icon name="alert" size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold text-[#5b403a]">
                          Restraint use documented
                        </p>
                        <span className="text-[9px] font-semibold text-[#b14f3d]">
                          HIGH
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-[#806b65]">
                        Soft restraints discontinued 18 hours ago. Most
                        facilities require 24–48 documented restraint-free
                        hours before acceptance.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-[#eadfc9] bg-[#fffcf5] p-3">
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#f8ecd3] text-[#99691f]">
                      <Icon name="bed" size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold text-[#594d38]">
                          Bariatric equipment required
                        </p>
                        <span className="text-[9px] font-semibold text-[#97671e]">
                          MODERATE
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-[#7d7463]">
                        BMI 41; facility must confirm a bariatric bed, lift, and
                        two-person transfer support.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-[#dce5e2] bg-[#fafcfb] p-3">
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#e8f0ed] text-[#547168]">
                      <Icon name="document" size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold text-[#40564f]">
                          High-cost medication review
                        </p>
                        <span className="text-[9px] font-semibold text-[#647b74]">
                          LOW
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-[#71817c]">
                        Apixaban and Trelegy are on formulary at two of three
                        facilities; Riverside requires pharmacy verification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold text-[#334f47]">
                      Financial recommendation
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#889691]">
                      Estimated 14-day episode under current benefits
                    </p>
                  </div>
                  <Icon name="dollar" size={19} className="text-[#1b785e]" />
                </div>
                <div className="mt-4 rounded-xl bg-[#edf7f3] p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#197358] text-white">
                      <Icon name="sparkles" size={15} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#205c4c]">
                        Best overall value: Harborview Post-Acute
                      </p>
                      <p className="mt-1 text-[10px] leading-relaxed text-[#5d786f]">
                        It costs the patient $140 more than Greenfield, but
                        today’s bed availability avoids an estimated $2,450
                        additional hospital day and offers the strongest
                        respiratory and bariatric support.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-[#e2e9e7] p-3">
                    <p className="text-[9px] text-[#84928e]">
                      Patient estimate
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-[#2e4a43]">
                      $350
                    </p>
                    <p className="text-[8px] text-[#96a19e]">$25/day copay</p>
                  </div>
                  <div className="rounded-lg border border-[#e2e9e7] p-3">
                    <p className="text-[9px] text-[#84928e]">Payer estimate</p>
                    <p className="mt-1 text-[15px] font-semibold text-[#2e4a43]">
                      $8,680
                    </p>
                    <p className="text-[8px] text-[#96a19e]">14-day allowed</p>
                  </div>
                  <div className="rounded-lg border border-[#e2e9e7] p-3">
                    <p className="text-[9px] text-[#84928e]">
                      Hospital transfer
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-[#2e4a43]">
                      $185
                    </p>
                    <p className="text-[8px] text-[#96a19e]">Transport est.</p>
                  </div>
                  <div className="rounded-lg border border-[#cfe3dc] bg-[#f5fbf8] p-3">
                    <p className="text-[9px] text-[#658078]">
                      Delay exposure
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-[#176b54]">
                      $0
                    </p>
                    <p className="text-[8px] text-[#759087]">
                      Same-day placement
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h4 className="text-[12px] font-semibold text-[#334f47]">
                    Recommended facilities
                  </h4>
                  <p className="mt-0.5 text-[10px] text-[#889691]">
                    Select a facility to review its fit and estimated costs.
                  </p>
                </div>
                <p className="flex items-center gap-1.5 text-[9px] text-[#84928e]">
                  <Icon name="clock" size={11} />
                  Availability verified 12 minutes ago
                </p>
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                {facilities.map((facility, index) => {
                  const isSelected = selectedFacility === index
                  return (
                    <button
                      key={facility.name}
                      onClick={() => setSelectedFacility(index)}
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
                            isSelected
                              ? "bg-[#dcefe8] text-[#176b54]"
                              : "bg-[#edf2f0] text-[#60766f]"
                          }`}
                        >
                          <Icon name="building" size={17} />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-[#29463f]">
                            {facility.name}
                          </p>
                          <p className="mt-0.5 text-[9px] text-[#869590]">
                            {facility.distance} · {facility.availability}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-[8px] uppercase tracking-[.08em] text-[#899792]">
                            Clinical match
                          </p>
                          <p className="mt-0.5 text-[20px] font-semibold tracking-tight text-[#21483d]">
                            {facility.match}%
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                            index === 0
                              ? "bg-[#def0e9] text-[#176b54]"
                              : index === 1
                                ? "bg-[#e6edf8] text-[#4b6486]"
                                : "bg-[#eef1f0] text-[#667873]"
                          }`}
                        >
                          {facility.rank}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e7edeb]">
                        <div
                          className={`h-full rounded-full ${index === 0 ? "bg-[#25866a]" : "bg-[#86aa9f]"}`}
                          style={{ width: `${facility.match}%` }}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {facility.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className="rounded-md bg-white px-2 py-1 text-[8px] font-medium text-[#657a74] ring-1 ring-[#e0e7e5]"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                      <div className="my-4 border-t border-[#e5ebe9]" />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[8px] text-[#899692]">
                            Patient / 14 days
                          </p>
                          <p className="mt-0.5 text-[13px] font-semibold text-[#354f48]">
                            {facility.patientCost}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] text-[#899692]">
                            Payer / 14 days
                          </p>
                          <p className="mt-0.5 text-[13px] font-semibold text-[#354f48]">
                            {facility.payerCost}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-4 space-y-2 rounded-xl border border-[#d9e8e3] bg-white p-3">
                          <p className="text-[9px] leading-relaxed text-[#60746e]">
                            {facility.note}
                          </p>
                          <p className="flex items-start gap-1.5 text-[9px] font-medium text-[#a45b3f]">
                            <Icon
                              name="alert"
                              size={11}
                              className="mt-0.5 shrink-0"
                            />
                            {facility.barrier}
                          </p>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#e2e8e6] bg-[#fafcfb] px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex items-start gap-2 text-[9px] leading-relaxed text-[#7b8b87]">
                  <Icon
                    name="alert"
                    size={12}
                    className="mt-0.5 shrink-0"
                  />
                  Estimates are decision-support only and require benefits,
                  authorization, bed, formulary, and clinical acceptance
                  verification before placement.
                </div>
                <button
                  onClick={() =>
                    setToast(
                      `Referral sent to ${facilities[selectedFacility].name} for ${patient.name}`,
                    )
                  }
                  className="ml-auto flex shrink-0 items-center gap-2 rounded-lg bg-[#176b54] px-3.5 py-2 text-[10px] font-semibold text-white hover:bg-[#105b45]"
                >
                  Send referral to{" "}
                  {facilities[selectedFacility].name.split(" ")[0]}
                  <Icon name="arrow" size={12} />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {showGenerator && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#112d27]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          onMouseDown={() => setShowGenerator(false)}
        >
          <div
            className="max-h-[94vh] w-full max-w-[620px] overflow-y-auto rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#e7ecea] p-6">
              <div className="flex gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e1f1ec] text-[#147157]">
                  <Icon name="sparkles" size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold tracking-tight text-[#173d34]">
                    Generate readiness checklist
                  </h3>
                  <p className="mt-1 text-[11px] text-[#7b8b87]">
                    Combine ambient rounds and documented clinical data.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerator(false)}
                className="rounded-lg p-2 text-[#7a8a86] hover:bg-[#f0f4f2]"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-[#dbe4e1] bg-[#f9fbfa] p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-9 w-9 place-items-center rounded-lg text-[10px] font-bold text-[#234a40]"
                    style={{ background: patient.color }}
                  >
                    {patient.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#29463f]">
                      {patient.name}
                    </p>
                    <p className="text-[10px] text-[#82918d]">
                      {patient.meta} · {patient.room}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-[#e4f1ed] px-2.5 py-1 text-[9px] font-semibold text-[#156b52]">
                    Selected
                  </span>
                </div>
              </div>
              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#385149]">
                    Ambient rounds transcript
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-[#6b817a]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#35a881]" />
                    Synced 6m ago
                  </span>
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="h-28 w-full resize-none rounded-xl border border-[#d9e3e0] bg-white p-3 text-[11px] leading-relaxed text-[#50635e] outline-none focus:border-[#74a99a] focus:ring-2 focus:ring-[#dceee8]"
                />
              </label>
              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#385149]">
                    Documented clinical notes
                  </span>
                  <span className="text-[9px] text-[#889691]">Optional</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-20 w-full resize-none rounded-xl border border-[#d9e3e0] bg-white p-3 text-[11px] leading-relaxed text-[#50635e] outline-none focus:border-[#74a99a] focus:ring-2 focus:ring-[#dceee8]"
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["EHR notes", "Rounds audio", "Care team"].map((source) => (
                  <div
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-[#f1f5f3] py-2 text-[9px] font-medium text-[#61756f]"
                    key={source}
                  >
                    <Icon name="check" size={11} className="text-[#238066]" />
                    {source}
                  </div>
                ))}
              </div>
              {generated && (
                <div className="flex items-start gap-3 rounded-xl border border-[#cce5dc] bg-[#eff8f5] p-3.5">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#268268] text-white">
                    <Icon name="check" size={13} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#225e4e]">
                      {addedTitles.length
                        ? "Checklist updated"
                        : "Checklist already up to date"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#618078]">
                      {addedTitles.length
                        ? `${addedTitles.length} new task${addedTitles.length === 1 ? "" : "s"} added and priorities recalculated from the latest notes.`
                        : "No new action items found — every item in these notes is already on the checklist."}
                    </p>
                    {addedTitles.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {addedTitles.map((title) => (
                          <li
                            key={title}
                            className="flex items-center gap-1.5 text-[10px] font-medium text-[#2f6b5a]"
                          >
                            <Icon name="plus" size={11} />
                            {title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#e7ecea] bg-[#fafcfb] px-6 py-4">
              <button
                onClick={() => setShowGenerator(false)}
                className="rounded-xl px-4 py-2.5 text-[11px] font-semibold text-[#667873] hover:bg-[#edf2f0]"
              >
                {generated ? "Done" : "Cancel"}
              </button>
              <button
                onClick={generateChecklist}
                disabled={generating}
                className="flex min-w-[178px] items-center justify-center gap-2 rounded-xl bg-[#156d53] px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#105b45] disabled:opacity-70"
              >
                {generating ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Analyzing clinical data...
                  </>
                ) : (
                  <>
                    <Icon name="sparkles" size={14} />
                    Generate checklist
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="toast-in fixed bottom-6 left-1/2 z-[60] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2.5 rounded-xl bg-[#173d34] px-4 py-3 text-[12px] font-medium text-white shadow-xl"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#35a881]">
            <Icon name="check" size={12} />
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
