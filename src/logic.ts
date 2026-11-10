import type { Patient, Task, Urgency } from "./data"

type TaskTemplate = Omit<Task, "id" | "completed">

// Rule-based extraction: each rule maps phrases found in the rounds
// transcript / clinical notes to a checklist task. `covers` matches existing
// task titles that already handle the same need, so nothing is duplicated.
// Runs fully in the browser.
export const extractionRules: {
  pattern: RegExp
  covers: RegExp
  task: TaskTemplate
}[] = [
  {
    pattern: /oxygen|\bo2\b|concentrator|nasal cannula/,
    covers: /oxygen/i,
    task: { title: "Confirm home oxygen delivery", detail: "Verify concentrator delivery window and backup tank availability.", owner: "Case Management", due: "Due today", urgency: "High", effort: "20 min", category: "Coordination" },
  },
  {
    pattern: /medication rec|reconcil|anticoag|dosing|duplicate (prn|order)/,
    covers: /reconcil/i,
    task: { title: "Complete medication reconciliation", detail: "Reconcile home and inpatient medications before discharge.", owner: "Dr. Chen", due: "Due today", urgency: "High", effort: "15 min", category: "Clinical" },
  },
  {
    pattern: /\bpt\b|physical therap|walk|ambulat|mobility/,
    covers: /ambulat|\\bpt\\b|mobility/i,
    task: { title: "Patient ambulation assessment", detail: "Document safe ambulation distance and assist level.", owner: "Physical Therapy", due: "Due today", urgency: "Medium", effort: "30 min", category: "Clinical" },
  },
  {
    pattern: /follow[- ]?up|pulmonolog|endocrin|clinic|appointment|wound check/,
    covers: /follow-up|follow up|wound check/i,
    task: { title: "Schedule follow-up appointment", detail: "Book the outpatient visit named in rounds and give the patient the details.", owner: "Unit Coordinator", due: "Due today", urgency: "Medium", effort: "10 min", category: "Follow-up" },
  },
  {
    pattern: /inhaler|teach[- ]?back|insulin teaching|educator/,
    covers: /educat|teach|inhaler|technique/i,
    task: { title: "Patient education with teach-back", detail: "Cover new medications or devices and confirm understanding with teach-back.", owner: "Nursing", due: "Due today", urgency: "Medium", effort: "20 min", category: "Education" },
  },
  {
    pattern: /discharge summary/,
    covers: /discharge summary/i,
    task: { title: "Finalize discharge summary", detail: "Document hospital course and pending results.", owner: "Dr. Chen", due: "Due today", urgency: "Low", effort: "20 min", category: "Documentation" },
  },
  {
    pattern: /pick (him|her|them)? ?up|picking (him|her|them) up|transport|ride home|drive (him|her|them) home/,
    covers: /transport/i,
    task: { title: "Verify caregiver transport plan", detail: "Confirm who is picking the patient up and the pickup time at bedside.", owner: "Case Management", due: "Due by 2:30 PM", urgency: "Medium", effort: "5 min", category: "Coordination" },
  },
  {
    pattern: /walker|wheelchair|commode|hospital bed|bariatric|\bcane\b|shower chair|\blift\b/,
    covers: /equipment|bed and lift|walker/i,
    task: { title: "Order durable medical equipment", detail: "Place DME order and confirm delivery before discharge.", owner: "Case Management", due: "Due today", urgency: "High", effort: "15 min", category: "Coordination" },
  },
  {
    pattern: /home health|visiting nurse|nursing visit|home infusion/,
    covers: /home health|home infusion/i,
    task: { title: "Arrange home health referral", detail: "Send referral and confirm start-of-care date with the agency.", owner: "Case Management", due: "Due today", urgency: "High", effort: "15 min", category: "Coordination" },
  },
  {
    pattern: /prescription|pharmacy|meds to beds|\brx\b/,
    covers: /prescription/i,
    task: { title: "Send discharge prescriptions", detail: "E-prescribe new medications and confirm pharmacy coverage.", owner: "Dr. Chen", due: "Due by 12:00 PM", urgency: "High", effort: "10 min", category: "Clinical" },
  },
  {
    pattern: /\blabs?\b|bloodwork|hemoglobin|cultures? pending|pending results/,
    covers: /\\blabs?\\b|hemoglobin|cultures/i,
    task: { title: "Repeat labs before discharge", detail: "Order the labs named in rounds and assign who reviews the results.", owner: "Dr. Chen", due: "Due today", urgency: "Medium", effort: "10 min", category: "Clinical" },
  },
  {
    pattern: /smok|tobacco|nicotine/,
    covers: /smok/i,
    task: { title: "Offer smoking cessation counseling", detail: "Discuss cessation resources and nicotine replacement options.", owner: "Respiratory Therapy", due: "Due today", urgency: "Low", effort: "10 min", category: "Education" },
  },
  {
    pattern: /diet|nutrition|low[- ]sodium|carb count/,
    covers: /diet/i,
    task: { title: "Provide dietary education", detail: "Review discharge diet with patient and caregiver using teach-back.", owner: "Nursing", due: "Due today", urgency: "Low", effort: "10 min", category: "Education" },
  },
  {
    pattern: /fall risk|stairs|home safety|lives alone/,
    covers: /home safety/i,
    task: { title: "Complete home safety review", detail: "Assess fall risk, stairs at home, and caregiver support.", owner: "Occupational Therapy", due: "Due today", urgency: "Medium", effort: "20 min", category: "Clinical" },
  },
  {
    pattern: /prior auth|authorization|\bsnf\b|skilled nursing|rehab referral|acute rehab/,
    covers: /prior auth/i,
    task: { title: "Submit prior authorization", detail: "Send clinicals to payer for post-acute placement approval.", owner: "Case Management", due: "Due today", urgency: "High", effort: "20 min", category: "Coordination" },
  },
  {
    pattern: /picc|central line|line care/,
    covers: /picc/i,
    task: { title: "PICC placement", detail: "Vascular access consult for long-term IV access.", owner: "Vascular Access", due: "Due today", urgency: "High", effort: "45 min", category: "Clinical" },
  },
  {
    pattern: /coverage|copay|formulary|cost/,
    covers: /coverage|formulary/i,
    task: { title: "Verify medication coverage", detail: "Confirm formulary status and copay so the patient can fill prescriptions.", owner: "Clinical Pharmacy", due: "Due today", urgency: "Medium", effort: "15 min", category: "Coordination" },
  },
]

export function extractTasks(text: string, existing: Task[], patientId: string): Task[] {
  const lower = text.toLowerCase()
  const now = Date.now()
  return extractionRules
    .filter(
      (rule) =>
        rule.pattern.test(lower) &&
        !existing.some((task) => rule.covers.test(task.title)),
    )
    .map((rule, i) => ({
      ...rule.task,
      id: `${patientId}-g${now}-${i}`,
      completed: false,
    }))
}

export const urgencyRank: Record<Urgency, number> = { High: 0, Medium: 1, Low: 2 }

export function sortTasks(tasks: Task[]) {
  return [...tasks].sort(
    (a, b) =>
      Number(a.completed) - Number(b.completed) ||
      urgencyRank[a.urgency] - urgencyRank[b.urgency],
  )
}

export function readiness(p: Patient) {
  const total = p.tasks.length
  if (!total) return p.baseline
  const done = p.tasks.filter((t) => t.completed).length
  return Math.round(p.baseline + ((100 - p.baseline) * done) / total)
}

export type Status = "Ready for discharge" | "Likely discharge today" | "Likely tomorrow" | "Not ready"
export const statuses: Status[] = ["Ready for discharge", "Likely discharge today", "Likely tomorrow", "Not ready"]

export function status(p: Patient): Status {
  const r = readiness(p)
  if (r === 100 || (r >= 85 && !p.tasks.some((t) => !t.completed && t.urgency === "High")))
    return "Ready for discharge"
  if (r >= 60) return "Likely discharge today"
  if (r >= 40) return "Likely tomorrow"
  return "Not ready"
}

export function openTasks(p: Patient) {
  return p.tasks.filter((t) => !t.completed)
}

export function blocker(p: Patient) {
  const open = openTasks(p)
  return open.find((t) => t.urgency === "High") ?? sortTasks(open)[0]
}

export function parseMinutes(effort: string) {
  const value = parseInt(effort, 10)
  return Number.isFinite(value) ? value : 0
}

export function openEffort(p: Patient) {
  return openTasks(p).reduce((sum, t) => sum + parseMinutes(t.effort), 0)
}

export function formatMinutes(total: number) {
  if (total === 0) return "0m"
  const h = Math.floor(total / 60)
  const m = total % 60
  return h ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`
}

export function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}
