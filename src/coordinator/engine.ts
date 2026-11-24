import {
  facilityDirectory,
  facilityLevels,
  matchFacilities,
  payerFamily,
  payers,
  vendors,
  type Destination,
  type Facility,
  type Need,
} from "./directory"

// The outside-Epic discharge coordinator (Tier 1 of the task inventory).
// Staff enter a short profile and approve the referral packet; the agent then
// runs every piece of outside outreach in parallel: facilities, payer portal,
// DME, home health, infusion, transport and family. Outside parties are
// simulated: each one answers according to its directory stats, using a
// seeded random generator so a demo plays out the same way every time.

export type Channel = "fax" | "email" | "phone" | "portal" | "text" | "system"
export type StreamKind = "facility" | "auth" | "dme" | "homehealth" | "infusion" | "transport" | "family"
export type Status =
  | "queued"
  | "sent"
  | "waiting"
  | "info-requested"
  | "accepted"
  | "declined"
  | "confirmed"
  | "cancelled"
  | "submitted"
  | "approved"
  | "denied"
  | "appeal"
  | "booked"
  | "not-needed"

export type Stream = {
  id: string
  kind: StreamKind
  label: string
  party: string
  channel: Channel
  status: Status
  /** Family's rank for facility referrals. */
  rank?: number
  attempts: number
  lastAt?: number
  note: string
}

export type Actor = "agent" | "outside" | "staff" | "family"
export type LogEntry = { at: number; streamId?: string; actor: Actor; channel: Channel; text: string }

export type Gate = {
  id: string
  kind: "approve-packet" | "approve-appeal" | "family-escalation"
  title: string
  detail: string
  at: number
  draft?: string
  resolved?: boolean
}

export type Profile = {
  destination: Destination
  zip: string
  coverage: string
  needs: Need[]
  family: { name: string; relation: string; phone: string }
  /** When a caregiver can be home, e.g. "Weekdays after 3 PM". */
  caregiverWindow: string
  dme: string[]
  homeServices: string[]
}

type Scheduled = { at: number; streamId: string; type: string }

export type Coordination = {
  patientId: string
  patientName: string
  profile: Profile
  startedAt: number
  now: number
  matches: { id: string; score: number; reasons: string[]; excluded?: string }[]
  familyChoices?: string[]
  packet: { name: string; ready: boolean }[]
  packetApproved: boolean
  streams: Stream[]
  log: LogEntry[]
  gates: Gate[]
  queue: Scheduled[]
  /** Confirmed destination and discharge time. */
  admission?: { party: string; at: number }
  /** Facility admission rules to add to the patient's checklist (#47). */
  checklistAdds: { title: string; detail: string }[]
  ready: boolean
}

const HOUR = 3_600_000

// ---- Deterministic randomness -------------------------------------------------

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}
const rand = (c: Coordination, key: string) => hash(`${c.patientId}:${key}`)

// ---- Small helpers --------------------------------------------------------------

const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
const day = (ms: number) => new Date(ms).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
export const when = (ms: number) => `${day(ms)}, ${time(ms)}`

function tomorrowAt(now: number, hour: number) {
  const d = new Date(now)
  d.setDate(d.getDate() + 1)
  d.setHours(hour, 0, 0, 0)
  return d.getTime()
}

function stream(c: Coordination, id: string) {
  return c.streams.find((s) => s.id === id)!
}
function log(c: Coordination, actor: Actor, channel: Channel, text: string, streamId?: string) {
  c.log.push({ at: c.now, actor, channel, text, streamId })
  if (streamId) {
    const s = stream(c, streamId)
    s.lastAt = c.now
  }
}
function schedule(c: Coordination, hours: number, streamId: string, type: string) {
  c.queue.push({ at: c.now + Math.max(0.05, hours) * HOUR, streamId, type })
}
function set(c: Coordination, id: string, status: Status, note: string) {
  const s = stream(c, id)
  s.status = status
  s.note = note
}
function addStream(c: Coordination, s: Omit<Stream, "attempts" | "note" | "status"> & { status?: Status; note?: string }) {
  c.streams.push({ attempts: 0, status: "queued", note: "Queued", ...s })
}
const facilityById = (id: string) => facilityDirectory.find((f) => f.id === id)!
const isFacilityPath = (p: Profile) => facilityLevels.includes(p.destination)
const firstName = (c: Coordination) => c.patientName.split(" ")[0]

function notifyFamily(c: Coordination, text: string) {
  log(c, "agent", "text", `Texted ${c.profile.family.name}: “${text}”`, "family")
}

// ---- Start ----------------------------------------------------------------------

export function startCoordination(patient: { id: string; name: string }, profile: Profile, now: number): Coordination {
  const c: Coordination = {
    patientId: patient.id,
    patientName: patient.name,
    profile,
    startedAt: now,
    now,
    matches: [],
    packet: [
      { name: "Face sheet and insurance card", ready: true },
      { name: "H&P and latest progress note", ready: true },
      { name: "PT/OT notes from the last 24 h", ready: true },
      { name: "Medication list", ready: true },
    ],
    packetApproved: false,
    streams: [],
    log: [],
    gates: [],
    queue: [],
    checklistAdds: [],
    ready: false,
  }
  const fam = profile.family
  addStream(c, { id: "family", kind: "family", label: "Family updates", party: `${fam.name} (${fam.relation})`, channel: "text" })
  log(c, "staff", "system", `Coordination started: ${profile.destination}, ${profile.coverage}${profile.needs.length ? `, needs ${profile.needs.join(", ")}` : ""}`)
  log(c, "agent", "text", `Texted ${fam.phone} to confirm it reaches ${fam.name} and ask when a caregiver can be home`, "family")
  set(c, "family", "sent", "Confirming contact details")
  schedule(c, 0.4, "family", "family:verified")
  schedule(c, 7, "family", "family:question")
  if (rand(c, "upset") < 0.6) schedule(c, 26, "family", "family:upset")

  if (isFacilityPath(profile)) {
    c.matches = matchFacilities(profile.destination, profile.needs, profile.coverage).map((m) => ({
      id: m.facility.id,
      score: m.score,
      reasons: m.reasons,
      excluded: m.excluded,
    }))
    const eligible = c.matches.filter((m) => !m.excluded)
    log(c, "agent", "system", `Matched ${eligible.length} facilities for ${profile.destination} (${c.matches.length - eligible.length} excluded by care needs or insurance)`)
    schedule(c, 0.2, "family", "family:list")
    c.gates.push({
      id: "packet",
      kind: "approve-packet",
      title: "Approve the referral packet",
      detail: "Check the packet before it goes to facilities. Referrals go to the family's choices as soon as you approve.",
      at: now,
    })
  } else {
    startHome(c)
  }
  return c
}

// ---- Facility placement ---------------------------------------------------------

/** Staff approved the packet. */
export function approvePacket(c0: Coordination): Coordination {
  const c = structuredClone(c0)
  c.packetApproved = true
  resolve(c, "packet")
  log(c, "staff", "system", "Referral packet approved")
  if (c.familyChoices) sendReferrals(c, c.familyChoices)
  else log(c, "agent", "system", "Referrals will go out as soon as the family's choices come in")
  return c
}

/** Send now to the top matches without waiting for the family. */
export function sendWithoutFamily(c0: Coordination): Coordination {
  const c = structuredClone(c0)
  const top = c.matches.filter((m) => !m.excluded).slice(0, 4).map((m) => m.id)
  c.familyChoices = top
  log(c, "staff", "system", "Sending to the top matches without waiting for family choices")
  if (c.packetApproved) sendReferrals(c, top)
  return c
}

function sendReferrals(c: Coordination, ids: string[]) {
  const fresh = ids.filter((id) => !c.streams.some((s) => s.id === `fac-${id}`))
  if (!fresh.length) return
  log(c, "agent", "system", `Sending referrals to ${fresh.length} facilities at once`)
  fresh.forEach((id) => contactFacility(c, facilityById(id), ids.indexOf(id) + 1))
}

function contactFacility(c: Coordination, f: Facility, rank: number) {
  const id = `fac-${f.id}`
  addStream(c, { id, kind: "facility", label: "Referral", party: f.name, channel: "fax", rank })
  const s = stream(c, id)
  s.attempts = 1
  log(c, "agent", "fax", `Faxed the referral packet to ${f.name} at ${f.faxOutdated ?? f.fax}`, id)
  set(c, id, "sent", `Referral faxed ${time(c.now)}`)
  if (f.faxOutdated) schedule(c, 0.1, id, "fac:fax-failed")
  const respond = f.responseHours * (0.6 + rand(c, `${f.id}:respond`) * 0.9)
  for (const h of [4, 24, 48]) if (h < respond) schedule(c, h, id, "fac:followup")
  if (rand(c, `${f.id}:info`) < 0.4) schedule(c, respond * 0.5, id, "fac:info")
  schedule(c, respond, id, "fac:decision")
}

function facilityEvent(c: Coordination, ev: Scheduled) {
  const s = stream(c, ev.streamId)
  if (["cancelled", "confirmed", "declined"].includes(s.status) && ev.type !== "fac:deadline") return
  const f = facilityById(ev.streamId.slice(4))
  switch (ev.type) {
    case "fac:fax-failed":
      log(c, "outside", "fax", `Fax to ${f.faxOutdated} failed: number no longer in service`, s.id)
      log(c, "agent", "fax", `Found ${f.name}'s current admissions fax ${f.fax}, resent the packet and updated the directory`, s.id)
      set(c, s.id, "sent", "Resent to the corrected fax number")
      break
    case "fac:followup":
      s.attempts++
      s.channel = "phone"
      log(c, "agent", "phone", `Called ${f.name} admissions (follow-up ${s.attempts - 1}): referral is still under review`, s.id)
      set(c, s.id, "waiting", `No answer yet · follow-up call ${s.attempts - 1}`)
      break
    case "fac:info":
      log(c, "outside", "email", `${f.name} asked for an updated PT note and medication list`, s.id)
      set(c, s.id, "info-requested", "Asked for more information")
      schedule(c, 0.3, s.id, "fac:info-sent")
      break
    case "fac:info-sent":
      log(c, "agent", "email", `Sent ${f.name} today's PT note and the current medication list`, s.id)
      set(c, s.id, "waiting", "Extra documents sent")
      break
    case "fac:decision": {
      const r = rand(c, `${f.id}:decision`)
      if (r < f.acceptRate) {
        log(c, "outside", "phone", `${f.name} accepted: bed available ${day(tomorrowAt(c.now, 11))}`, s.id)
        set(c, s.id, "accepted", "Accepted · bed offered")
        if (!c.queue.some((q) => q.type === "fac:deadline")) schedule(c, 24, s.id, "fac:deadline")
      } else {
        const reason = r < f.acceptRate + (1 - f.acceptRate) / 2 ? "no bed until next week" : "can't meet the care needs with current staffing"
        log(c, "outside", "fax", `${f.name} declined: ${reason}`, s.id)
        set(c, s.id, "declined", `Declined · ${reason}`)
        autoAdvance(c)
      }
      tryConfirm(c, false)
      break
    }
    case "fac:deadline":
      tryConfirm(c, true)
      break
  }
}

/** After a denial, contact the next ranked facility nobody has tried yet. */
function autoAdvance(c: Coordination) {
  if (c.admission) return
  const tried = new Set(c.streams.filter((s) => s.kind === "facility").map((s) => s.id.slice(4)))
  const next = c.matches.find((m) => !m.excluded && !tried.has(m.id))
  if (!next) {
    const open = c.streams.some((s) => s.kind === "facility" && !["declined", "cancelled"].includes(s.status))
    if (!open)
      log(c, "agent", "system", "Every matched facility has declined. Widen the search area or review the care needs")
    return
  }
  const rank = Math.max(...c.streams.filter((s) => s.kind === "facility").map((s) => s.rank ?? 0)) + 1
  log(c, "agent", "system", `Auto-advanced to the next ranked facility, ${facilityById(next.id).name}`)
  contactFacility(c, facilityById(next.id), rank)
}

/** Confirm the family's highest-ranked acceptance once higher choices have answered (or after 24 h). */
function tryConfirm(c: Coordination, deadline: boolean) {
  if (c.admission) return
  const ranked = c.streams.filter((s) => s.kind === "facility").sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
  let pick: Stream | undefined
  for (const s of ranked) {
    if (["declined", "cancelled"].includes(s.status)) continue
    if (s.status === "accepted") {
      pick = s
      break
    }
    if (!deadline) return // a higher choice hasn't answered yet
  }
  if (!pick) return
  const at = tomorrowAt(c.now, 11)
  c.admission = { party: pick.party, at }
  log(c, "agent", "phone", `Confirmed the bed at ${pick.party}: admission ${when(at)}`, pick.id)
  set(c, pick.id, "confirmed", `Bed confirmed · admission ${when(at)}`)
  for (const s of ranked)
    if (s !== pick && !["declined", "cancelled"].includes(s.status)) {
      log(c, "agent", "email", `Let ${s.party} know the patient is placed elsewhere`, s.id)
      set(c, s.id, "cancelled", "Withdrawn · placed elsewhere")
    }
  notifyFamily(c, `Good news: ${pick.party} has a bed for ${firstName(c)}. Planned move ${when(at)}. We'll confirm the ride.`)
  const f = facilityById(pick.id.slice(4))
  for (const rule of f.rules) {
    c.checklistAdds.push({ title: rule.charAt(0).toUpperCase() + rule.slice(1), detail: `${f.name} admission requirement, added by the coordinator.` })
    log(c, "agent", "system", `Added ${f.name}'s admission rule to the checklist: ${rule}`, pick.id)
  }
  startAuth(c)
}

// ---- Insurance --------------------------------------------------------------------

function startAuth(c: Coordination) {
  const fam = payerFamily(c.profile.coverage)
  const payer = payers[fam]
  addStream(c, { id: "auth", kind: "auth", label: "Prior authorization", party: fam, channel: "portal" })
  if (!payer.needsAuth(c.profile.destination)) {
    log(c, "agent", "system", `No prior auth needed: ${fam} doesn't require it for ${c.profile.destination}`, "auth")
    set(c, "auth", "not-needed", "Not required for this plan")
    startTransport(c)
    return
  }
  schedule(c, 0.3, "auth", "auth:submit")
  set(c, "auth", "queued", `Submitting on ${payer.portal}`)
}

function authEvent(c: Coordination, ev: Scheduled) {
  const payer = payers[payerFamily(c.profile.coverage)]
  const s = stream(c, "auth")
  switch (ev.type) {
    case "auth:submit": {
      s.attempts++
      const due = c.now + payer.turnaroundHours * HOUR
      log(c, "agent", "portal", `Submitted prior auth for ${c.profile.destination} on ${payer.portal} with the clinical packet. Decision due ${when(due)}`, s.id)
      const dow = new Date(c.now).getDay()
      if (dow === 4 || dow === 5)
        log(c, "agent", "system", "Submitted before the Friday cutoff so the review doesn't stall over the weekend", s.id)
      set(c, s.id, "submitted", `Submitted · decision due ${when(due)}`)
      schedule(c, payer.turnaroundHours * 0.4, s.id, "auth:check")
      schedule(c, payer.turnaroundHours * (0.55 + rand(c, "auth:t") * 0.4), s.id, "auth:decision")
      break
    }
    case "auth:check":
      if (s.status !== "submitted") return
      log(c, "agent", "portal", `Checked ${payer.portal}: still in clinical review`, s.id)
      break
    case "auth:decision":
      if (s.status !== "submitted") return
      if (rand(c, "auth:deny") < 0.4) {
        log(c, "outside", "portal", `${payer.family} denied: "skilled need not demonstrated for ${c.profile.destination}"`, s.id)
        set(c, s.id, "denied", "Denied · appeal drafted for review")
        c.gates.push({
          id: "appeal",
          kind: "approve-appeal",
          title: "Review and sign the appeal",
          detail: `${payer.family} denied the ${c.profile.destination} authorization. The agent drafted an appeal from the chart; a clinician needs to review and sign it.`,
          at: c.now,
          draft: appealDraft(c),
        })
        schedule(c, 0.5, s.id, "auth:p2p")
      } else approveAuth(c)
      break
    case "auth:p2p":
      log(c, "agent", "phone", `Booked a peer-to-peer with ${payer.family}'s medical director for Dr. Chen, ${when(tomorrowAt(c.now, 9))}`, s.id)
      break
    case "auth:appeal-decision":
      approveAuth(c, true)
      break
  }
}

/** If insurance came back after the planned date, move the discharge to the next morning. */
function keepDateAfterAuth(c: Coordination) {
  if (!c.admission || c.admission.at > c.now + 3 * HOUR) return
  const at = tomorrowAt(c.now, 11)
  log(c, "agent", "phone", `Insurance came back after the planned date, so moved the discharge to ${when(at)} and confirmed it with ${c.admission.party === "Home" ? "the home services" : c.admission.party}`)
  c.admission = { ...c.admission, at }
  const placed = c.streams.find((s) => s.status === "confirmed" && s.kind === "facility")
  if (placed) placed.note = `Bed confirmed · admission ${when(at)}`
}

function approveAuth(c: Coordination, onAppeal = false) {
  keepDateAfterAuth(c)
  log(c, "outside", "portal", `${payerFamily(c.profile.coverage)} approved ${c.profile.destination}${onAppeal ? " on appeal" : ""}`, "auth")
  set(c, "auth", "approved", onAppeal ? "Approved on appeal" : "Approved")
  notifyFamily(c, `Insurance approved ${firstName(c)}'s ${c.profile.destination === "Home with services" ? "home services" : "stay"}.`)
  startTransport(c)
}

export function approveAppeal(c0: Coordination, text: string): Coordination {
  const c = structuredClone(c0)
  resolve(c, "appeal")
  const g = c.gates.find((x) => x.id === "appeal")
  if (g) g.draft = text
  log(c, "staff", "system", "Dr. Chen reviewed and signed the appeal", "auth")
  log(c, "agent", "portal", "Submitted the signed appeal with the skilled-need justification", "auth")
  set(c, "auth", "appeal", "Appeal submitted")
  schedule(c, payers[payerFamily(c.profile.coverage)].turnaroundHours * 0.5, "auth", "auth:appeal-decision")
  return c
}

function appealDraft(c: Coordination) {
  const p = c.profile
  return [
    `Re: Expedited appeal of ${p.destination} authorization denial for ${c.patientName}`,
    "",
    `We request reconsideration of the denial of ${p.destination} level of care. ${c.patientName} requires daily skilled services that cannot be provided safely at a lower level of care:`,
    ...(p.needs.length ? p.needs.map((n) => `• ${n} management requiring licensed nursing`) : ["• Daily skilled nursing assessment"]),
    "• Daily physical and occupational therapy with measurable functional goals (see attached PT/OT notes from the last 24 h)",
    "• Medication management and monitoring after an acute hospitalization",
    "",
    `The patient was accepted by ${c.admission?.party ?? "the receiving facility"} for admission ${c.admission ? when(c.admission.at) : "on approval"}. Discharge home without these services carries a high risk of readmission.`,
    "",
    "Attached: H&P, latest progress note, PT/OT evaluations, medication list.",
    "",
    "Dr. Lena Chen, Attending Physician",
  ].join("\n")
}

// ---- Home path ------------------------------------------------------------------------

function startHome(c: Coordination) {
  const fam = payerFamily(c.profile.coverage)
  if (c.profile.dme.length) {
    const v = c.profile.dme.some((d) => /oxygen|concentrator|nebul/i.test(d)) ? vendors.find((x) => x.id === "penn-o2")! : vendors.find((x) => x.id === "keystone-dme")!
    addStream(c, { id: "dme", kind: "dme", label: "Equipment delivery", party: v.name, channel: "phone" })
    schedule(c, 0.2, "dme", "dme:order")
  }
  const agencies = vendors.filter((v) => v.kind === "homehealth" && v.payers.includes(fam)).slice(0, 3)
  if (c.profile.homeServices.length)
    agencies.forEach((a) => {
      addStream(c, { id: `hh-${a.id}`, kind: "homehealth", label: `Home health: ${c.profile.homeServices.join(", ")}`, party: a.name, channel: "fax" })
      schedule(c, 0.2, `hh-${a.id}`, "hh:send")
    })
  if (c.profile.needs.includes("IV antibiotics")) {
    addStream(c, { id: "infusion", kind: "infusion", label: "Home infusion", party: "Optima Home Infusion", channel: "email" })
    schedule(c, 0.3, "infusion", "inf:send")
  }
  if (!c.profile.dme.length && !c.profile.homeServices.length && !c.profile.needs.includes("IV antibiotics")) {
    c.admission = { party: "Home", at: tomorrowAt(c.now, 11) }
    startTransport(c)
  }
}

function homeEvent(c: Coordination, ev: Scheduled) {
  const s = stream(c, ev.streamId)
  if (s.status === "cancelled") return
  switch (ev.type) {
    case "dme:order":
      log(c, "agent", "phone", `Ordered ${c.profile.dme.join(", ")} from ${s.party}`, s.id)
      set(c, s.id, "sent", "Order placed · waiting for a delivery window")
      schedule(c, 2, s.id, "dme:window")
      break
    case "dme:window": {
      const offered = "tomorrow 9 AM–12 PM"
      log(c, "outside", "phone", `${s.party} offered delivery ${offered}`, s.id)
      if (/after|afternoon|evening|pm/i.test(c.profile.caregiverWindow)) {
        log(c, "agent", "phone", `${c.profile.family.name} can only be home ${c.profile.caregiverWindow.toLowerCase()}, so asked ${s.party} for an afternoon slot`, s.id)
        set(c, s.id, "waiting", "Rescheduling to the caregiver's window")
        schedule(c, 1, s.id, "dme:confirmed")
      } else {
        log(c, "agent", "phone", `Confirmed delivery ${offered}; ${c.profile.family.name} will be home`, s.id)
        set(c, s.id, "confirmed", `Delivery ${offered}`)
        homeCheck(c)
      }
      break
    }
    case "dme:confirmed":
      log(c, "outside", "phone", `${s.party} confirmed delivery tomorrow 3–6 PM`, s.id)
      set(c, s.id, "confirmed", "Delivery tomorrow 3–6 PM")
      notifyFamily(c, `${s.party} will deliver ${c.profile.dme.join(", ")} tomorrow between 3 and 6 PM.`)
      homeCheck(c)
      break
    case "hh:send": {
      const v = vendors.find((x) => x.id === s.id.slice(3))!
      s.attempts = 1
      log(c, "agent", "fax", `Sent the home health referral to ${v.name}`, s.id)
      set(c, s.id, "sent", "Referral sent")
      const h = v.responseHours * (0.6 + rand(c, `${v.id}:respond`) * 0.8)
      if (h > 4) schedule(c, 4, s.id, "hh:followup")
      schedule(c, h, s.id, "hh:decision")
      break
    }
    case "hh:followup":
      if (s.status !== "sent") return
      s.attempts++
      log(c, "agent", "phone", `Called ${s.party} intake: still checking staffing for the patient's zip code`, s.id)
      set(c, s.id, "waiting", "Follow-up call made")
      break
    case "hh:decision": {
      const won = c.streams.some((x) => x.kind === "homehealth" && x.status === "confirmed")
      if (won) return
      const others = c.streams.filter((x) => x.kind === "homehealth" && x !== s && !["declined", "cancelled"].includes(x.status))
      const accept = rand(c, `${s.id}:accept`) < 0.65 || others.length === 0
      if (!accept) {
        log(c, "outside", "fax", `${s.party} declined: no nurse coverage in ${c.profile.zip}`, s.id)
        set(c, s.id, "declined", "Declined · no coverage in that area")
        return
      }
      const soc = tomorrowAt(c.now, 13)
      log(c, "outside", "phone", `${s.party} accepted: start of care ${when(soc)}`, s.id)
      set(c, s.id, "confirmed", `Start of care ${when(soc)}`)
      for (const o of others) {
        log(c, "agent", "email", `Withdrew the referral from ${o.party}`, o.id)
        set(c, o.id, "cancelled", "Withdrawn · another agency accepted")
      }
      notifyFamily(c, `${s.party} will start home visits for ${firstName(c)} ${when(soc)}.`)
      homeCheck(c)
      break
    }
    case "inf:send":
      log(c, "agent", "email", "Sent the infusion order and insurance details to Optima Home Infusion", s.id)
      set(c, s.id, "sent", "Order sent")
      schedule(c, 3, s.id, "inf:benefit")
      break
    case "inf:benefit":
      log(c, "outside", "email", "Optima needs the medical-benefit approval from the payer before the first delivery", s.id)
      log(c, "agent", "email", `Emailed ${payerFamily(c.profile.coverage)} for the medical-benefit approval and copied Optima`, s.id)
      set(c, s.id, "waiting", "Waiting on medical-benefit approval")
      schedule(c, 6, s.id, "inf:approved")
      break
    case "inf:approved":
      log(c, "outside", "email", "Medical benefit approved; Optima confirmed first delivery and nurse teaching visit", s.id)
      set(c, s.id, "confirmed", "First delivery confirmed")
      homeCheck(c)
      break
  }
}

/** Once home services are lined up, settle the discharge time, auth and ride. */
function homeCheck(c: Coordination) {
  if (c.admission) return
  const pending = c.streams.some(
    (s) => ["dme", "infusion"].includes(s.kind) && s.status !== "confirmed",
  ) || (c.streams.some((s) => s.kind === "homehealth") && !c.streams.some((s) => s.kind === "homehealth" && s.status === "confirmed"))
  if (pending) return
  c.admission = { party: "Home", at: tomorrowAt(c.now, 11) }
  log(c, "agent", "system", `Home services are lined up; discharge set for ${when(c.admission.at)}`)
  if (c.profile.homeServices.length) startAuth(c)
  else startTransport(c)
}

// ---- Transport and readiness ----------------------------------------------------------

function startTransport(c: Coordination) {
  if (!c.admission) return
  const home = c.admission.party === "Home"
  const party = home
    ? `${c.profile.family.name} (${c.profile.family.relation})`
    : c.profile.needs.includes("Bariatric")
      ? "Metro BLS Ambulance (bariatric unit)"
      : "Center City Wheelchair Van"
  addStream(c, { id: "transport", kind: "transport", label: "Ride", party, channel: home ? "text" : "phone" })
  schedule(c, 0.5, "transport", "tx:book")
}

function transportEvent(c: Coordination, ev: Scheduled) {
  const s = stream(c, "transport")
  if (ev.type !== "tx:book" || !c.admission) return
  if (c.admission.party === "Home") {
    log(c, "agent", "text", `Confirmed by text that ${s.party} will drive ${firstName(c)} home at ${when(c.admission.at)}`, s.id)
  } else {
    log(c, "agent", "phone", `Booked ${s.party} to ${c.admission.party} for ${when(c.admission.at)}`, s.id)
  }
  set(c, s.id, "booked", `Pickup ${when(c.admission.at)}`)
  readyCheck(c)
}

function readyCheck(c: Coordination) {
  if (c.ready || !c.admission) return
  const done = c.streams.every((s) =>
    s.kind === "family" ? true : ["confirmed", "cancelled", "declined", "approved", "not-needed", "booked"].includes(s.status),
  )
  if (!done) return
  c.ready = true
  set(c, "family", "confirmed", "Kept up to date")
  log(c, "agent", "system", `Everything outside the hospital is lined up for ${when(c.admission.at)}`)
  notifyFamily(c, `Everything is set: ${firstName(c)} goes ${c.admission.party === "Home" ? "home" : `to ${c.admission.party}`} ${when(c.admission.at)}.`)
}

// ---- Family line (#6, #8, #30) ------------------------------------------------------------

function familyEvent(c: Coordination, ev: Scheduled) {
  const fam = c.profile.family
  switch (ev.type) {
    case "family:verified":
      log(c, "family", "text", `“Yes, this is ${fam.name}. I can be there ${c.profile.caregiverWindow.toLowerCase()}.”`, "family")
      log(c, "agent", "system", "Contact verified. Paste the confirmed number into Epic's emergency contact field", "family")
      set(c, "family", "confirmed", "Contact verified")
      break
    case "family:list": {
      const top = c.matches.filter((m) => !m.excluded).slice(0, 5)
      log(c, "agent", "text", `Sent ${fam.name} a link to compare ${top.length} matched facilities and rank their choices`, "family")
      set(c, "family", "waiting", "Waiting for facility choices")
      schedule(c, 3, "family", "family:choices")
      break
    }
    case "family:choices": {
      if (c.familyChoices) return
      const top = c.matches.filter((m) => !m.excluded).slice(0, 4).map((m) => m.id)
      if (top.length > 1 && rand(c, "family:swap") < 0.5) [top[0], top[1]] = [top[1], top[0]]
      c.familyChoices = top
      log(c, "family", "text", `Ranked choices: ${top.map((id, i) => `${i + 1}. ${facilityById(id).name}`).join(", ")}`, "family")
      set(c, "family", "confirmed", "Choices received")
      if (c.packetApproved) sendReferrals(c, top)
      break
    }
    case "family:question":
      log(c, "family", "text", `“Any news on ${firstName(c)}'s discharge?”`, "family")
      log(c, "agent", "text", `Replied with the current status: ${familyStatus(c)}`, "family")
      break
    case "family:upset":
      if (c.ready) return
      log(c, "family", "text", "“Nobody has called me back and I'm really worried. I need to talk to someone today.”", "family")
      log(c, "agent", "system", "Distress detected, so this went to the social worker instead of an automatic reply", "family")
      c.gates.push({
        id: "family-call",
        kind: "family-escalation",
        title: `Call ${fam.name} (${fam.relation})`,
        detail: `Upset text at ${time(c.now)}. ${fam.phone}. Current status: ${familyStatus(c)}`,
        at: c.now,
      })
      set(c, "family", "waiting", "Escalated to social work")
      break
  }
}

export function familyStatus(c: Coordination) {
  if (c.ready && c.admission) return `everything is set for ${when(c.admission.at)}`
  if (c.admission) return `${c.admission.party === "Home" ? "home services are arranged" : `${c.admission.party} has a bed`}; finishing insurance and the ride`
  const fac = c.streams.filter((s) => s.kind === "facility")
  if (fac.length) {
    const accepted = fac.filter((s) => s.status === "accepted").length
    return `referrals are with ${fac.length} facilities${accepted ? `, ${accepted} accepted so far` : ""}`
  }
  return isFacilityPath(c.profile) ? "we're preparing referrals" : "we're arranging home services"
}

export function resolveGate(c0: Coordination, id: string, note: string): Coordination {
  const c = structuredClone(c0)
  resolve(c, id)
  log(c, "staff", "phone", note, id === "family-call" ? "family" : undefined)
  if (id === "family-call") set(c, "family", "confirmed", "Social worker called back")
  return c
}

function resolve(c: Coordination, id: string) {
  const g = c.gates.find((x) => x.id === id)
  if (g) g.resolved = true
}

// ---- Clock ------------------------------------------------------------------------------

export function nextEventAt(c: Coordination) {
  return c.queue.reduce((m, q) => Math.min(m, q.at), Infinity)
}

/** Run every scheduled event up to `until`, in time order. */
export function advance(c0: Coordination, until: number): Coordination {
  const c = structuredClone(c0)
  for (let guard = 0; guard < 500; guard++) {
    c.queue.sort((a, b) => a.at - b.at)
    const ev = c.queue[0]
    if (!ev || ev.at > until) break
    c.queue.shift()
    c.now = ev.at
    const prefix = ev.type.split(":")[0]
    if (prefix === "fac") facilityEvent(c, ev)
    else if (prefix === "auth") authEvent(c, ev)
    else if (prefix === "tx") transportEvent(c, ev)
    else if (prefix === "family") familyEvent(c, ev)
    else homeEvent(c, ev)
    readyCheck(c)
  }
  c.now = Math.max(c.now, until)
  return c
}

export const statusTone: Record<Status, "neutral" | "progress" | "warn" | "good" | "bad"> = {
  queued: "neutral",
  sent: "progress",
  waiting: "progress",
  "info-requested": "warn",
  accepted: "good",
  declined: "bad",
  confirmed: "good",
  cancelled: "neutral",
  submitted: "progress",
  approved: "good",
  denied: "bad",
  appeal: "warn",
  booked: "good",
  "not-needed": "neutral",
}
