// The ClearPath assistant: watches each patient's discharge for things nobody
// has dealt with, nudges the person who owns them, and escalates if they stay
// open. In this demo the nudges arrive in ClearPath's Messages; in production
// the same text would go to Epic In Basket / Secure Chat once Penn enables it.

import { staff, type Patient } from "./data"
import { dueAt } from "./logic"
import { homeUnknown } from "./careProfile"

export type ReminderLevel = "nudge" | "escalated"
export type Reminder = {
  key: string
  pid: string
  /** Staff id of the person who owns it. */
  to: string
  title: string
  detail: string
  level: ReminderLevel
  /** Staff id told when it escalates. */
  escalateTo: string
  where: string
}

const H = 3_600_000

const ownerIds: [RegExp, string][] = [
  [/dr\.|physician|attending/i, "LC"],
  [/case manag/i, "MR"],
  [/social work/i, "SB"],
  [/physical therapy/i, "TH"],
  [/occupational/i, "NB"],
  [/speech|swallow/i, "AP"],
  [/pharm/i, "PN"],
  [/respiratory/i, "DW"],
]
export const ownerToStaff = (owner: string) => ownerIds.find(([re]) => re.test(owner))?.[1] ?? "KO"
export const staffName = (id: string) => {
  const s = staff.find((x) => x.id === id)
  return s ? `${s.name} (${s.role.toLowerCase()})` : id
}
const hours = (h: number) => (h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : `${Math.round(h * 10) / 10} h`)

/** Everything that currently needs a nudge, across all patients. */
export function findReminders(patients: Patient[], now = new Date()): Reminder[] {
  const out: Reminder[] = []
  for (const p of patients) {
    const c = p.coordination
    // Decisions the coordinator is waiting on (simulated clock).
    for (const g of c?.gates.filter((x) => !x.resolved) ?? []) {
      const age = (c!.now - g.at) / H
      const [limit, to, why] =
        g.kind === "approve-appeal"
          ? [2, "LC", "the insurance appeal is drafted and waiting for your signature"]
          : g.kind === "family-escalation"
            ? [1, "SB", "an upset family member is waiting for a call back"]
            : [1, "MR", "the referral packet needs approval before referrals can go out"]
      if (age < limit) continue
      out.push({
        key: `gate:${p.id}:${g.id}`,
        pid: p.id,
        to,
        title: g.title,
        detail: `${g.title} for ${p.name}: ${why} (open ${hours(age)}).`,
        level: age >= limit * 3 ? "escalated" : "nudge",
        escalateTo: g.kind === "approve-appeal" ? "KO" : "LC",
        where: `#/coordinator/${p.id}`,
      })
    }
    // High-urgency checklist items past their due time (real clock).
    for (const t of p.tasks) {
      if (t.completed || t.urgency !== "High" || t.automation?.state === "waiting") continue
      const at = dueAt(t, p, now)
      if (!at || at.getTime() > now.getTime()) continue
      const late = (now.getTime() - at.getTime()) / H
      out.push({
        key: `task:${p.id}:${t.id}`,
        pid: p.id,
        to: ownerToStaff(t.owner),
        title: t.title,
        detail: `${t.title} for ${p.name} was ${t.due.toLowerCase().replace(/^due /, "due ")} and is still open (${hours(late)} late). It's a discharge blocker.`,
        level: late >= 2 ? "escalated" : "nudge",
        escalateTo: "KO",
        where: `#/patients/${p.id}`,
      })
    }
    // Nobody has asked about the home situation yet.
    if (homeUnknown(p.home)) {
      const asked = p.tasks.find((t) => t.title === "Ask about home situation")
      out.push({
        key: `home:${p.id}`,
        pid: p.id,
        to: "SB",
        title: "Home situation unknown",
        detail: `Nobody has recorded ${p.name}'s address, type of home or who can help after discharge${asked ? " (task assigned, not done yet)" : ""}. Destination and equipment depend on it.`,
        level: asked ? "escalated" : "nudge",
        escalateTo: "MR",
        where: `#/patients/${p.id}`,
      })
    }
  }
  return out
}

export const nudgeText = (r: Reminder) =>
  `Reminder for ${staffName(r.to)}: ${r.detail} Open ${r.where.startsWith("#/coordinator") ? "the coordinator board" : "the patient card"} to deal with it.`
export const escalateText = (r: Reminder) =>
  `Still not addressed: ${r.title}. Escalated to ${staffName(r.escalateTo)} so it doesn't hold up discharge.`
export const resolvedText = (title: string) => `Resolved: ${title}. Nothing more needed from you on this one.`
