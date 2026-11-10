import type { Task } from "./data"

// Task automations: a playbook runs the routine steps of a task for you and
// waits on the one step that needs another person, with a fallback if it
// doesn't happen in time. In this demo every step is simulated; nothing is
// sent to pathology, paging, pharmacy or booking systems.

export type Playbook = {
  id: string
  name: string
  match: RegExp
  /** Steps the system does straight away. */
  steps: (task: Task) => string[]
  /** What it then waits for. */
  waitFor: string
  /** Button text for each outcome of the wait. */
  successLabel: string
  fallbackLabel: string
  /** Logged when the wait succeeds; the task is completed. */
  successLog: string
  /** Who the task goes to if the wait fails or times out. */
  escalateTo: string
  escalateLog: string
  /** Minutes to wait before escalating automatically. */
  timeoutMin: number
}

const bloodTest = (t: Task) => (/h(a)?emoglobin|\bhb\b|\bhgb\b/i.test(`${t.title} ${t.detail}`) ? "Hb" : "repeat bloods")

export const playbooks: Playbook[] = [
  {
    id: "bloods",
    name: "Repeat bloods",
    match: /repeat (h(a)?emoglobin|hb|labs?|bloods?)|recheck (labs|hb|bloods)|h(a)?emoglobin|\bhb\b|bloods/i,
    steps: (t) => [`Ordered ${bloodTest(t)} on a pathology request`, "Paged the phlebotomist for collection"],
    waitFor: "Waiting for phlebotomy to collect",
    successLabel: "Collected",
    fallbackLabel: "Unable to collect",
    successLog: "Phlebotomy collected the sample; result goes to the treating team",
    escalateTo: "JMO",
    escalateLog: "Phlebotomy couldn't collect, so the task was pushed to the JMO task list",
    timeoutMin: 60,
  },
  {
    id: "scripts",
    name: "Discharge scripts",
    match: /prescription|scripts?\b|\brx\b/i,
    steps: () => ["Drafted the discharge script from the medication chart", "Sent it to the ward pharmacist for verification"],
    waitFor: "Waiting for pharmacist verification",
    successLabel: "Verified",
    fallbackLabel: "Pharmacist query",
    successLog: "Pharmacist verified the script and sent it to the patient's pharmacy",
    escalateTo: "JMO",
    escalateLog: "Pharmacist raised a query, so the script was pushed to the JMO task list to review",
    timeoutMin: 45,
  },
  {
    id: "followup",
    name: "Book follow-up",
    match: /follow[- ]?up|appointment|wound check|clinic/i,
    steps: () => ["Sent the outpatient referral to the clinic", "Asked the clinic clerk to book a time"],
    waitFor: "Waiting for an appointment time",
    successLabel: "Booked",
    fallbackLabel: "Clinic can't book",
    successLog: "Appointment booked and added to the discharge letter",
    escalateTo: "Unit Coordinator",
    escalateLog: "Clinic couldn't book, so the task went to the unit coordinator to call",
    timeoutMin: 120,
  },
  {
    id: "equipment",
    name: "Equipment delivery",
    match: /oxygen|concentrator|equipment|bed and lift|walker|commode/i,
    steps: () => ["Sent the equipment order to the supplier", "Requested a delivery window"],
    waitFor: "Waiting for delivery confirmation",
    successLabel: "Confirmed",
    fallbackLabel: "No delivery slot",
    successLog: "Supplier confirmed delivery before discharge",
    escalateTo: "Case Management",
    escalateLog: "Supplier had no slot, so the task went to case management to arrange",
    timeoutMin: 90,
  },
  {
    id: "coverage",
    name: "Coverage check",
    match: /coverage|formulary|copay/i,
    steps: () => ["Sent a coverage and formulary query to pharmacy"],
    waitFor: "Waiting for the coverage answer",
    successLabel: "Covered",
    fallbackLabel: "Not covered",
    successLog: "Pharmacy confirmed coverage",
    escalateTo: "JMO",
    escalateLog: "Not covered, so the task was pushed to the JMO task list to choose an alternative",
    timeoutMin: 60,
  },
  {
    id: "auth",
    name: "Referral and authorisation",
    match: /prior auth|authori[sz]ation|referral/i,
    steps: () => ["Compiled the clinical summary from the chart", "Submitted it to the payer and receiving facility"],
    waitFor: "Waiting for a decision",
    successLabel: "Approved",
    fallbackLabel: "Declined or more info",
    successLog: "Approved by the payer and accepted by the facility",
    escalateTo: "Case Management",
    escalateLog: "More information was requested, so the task went to case management",
    timeoutMin: 240,
  },
]

export function playbookFor(task: Task): Playbook | undefined {
  if (task.automation) return playbooks.find((p) => p.id === task.automation!.playbook)
  return playbooks.find((p) => p.match.test(task.title))
}
