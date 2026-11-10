import { agKeys, emptyAssessment, type AGKey, type Assessment, type Patient, type Task, type Urgency } from "./data"
import { extractionRules, readiness, status } from "./logic"

// Built-in rounds summarizer (no AI service). It reads the round statement by
// statement, ties each one to this patient's diagnosis and checklist, and
// writes a short handoff as dot points (clinical status, what got done, what
// still blocks discharge, the plan) plus an A–G assessment. It does not repeat
// the transcript.

export type LocalSummary = {
  summary: string[]
  assessment: Assessment
  findings: string[]
  outlook: string
  newTasks: (Omit<Task, "id" | "completed"> & { evidence: string })[]
  completed: { taskId: string; evidence: string }[]
  urgency: { taskId: string; urgency: Urgency; reason: string }[]
}

type Topic = { label: string; pattern: RegExp; clinical?: boolean }

// A–G assessment: which letter a clinical clause belongs to.
const agPatterns: Record<AGKey, RegExp> = {
  A: /airway|patent|(speaking|talking) (in )?(full )?sentences|talking normally|stridor|secretions|protecting (his|her|their) airway/,
  B: /breath|resp(iratory)? rate|\brr\b|\bsats?\b|spo2|sp02|o2 sat|saturat|oxygen|\bo2\b|lit(er|re)s?\b|\d\s?l\b|nasal cannula|\bnc\b|room air|\bra\b|wheez|crackles|chest|cough|sputum|\bnebs?\b|cxr|x-?ray|dyspn|short of breath|\bsob\b/,
  C: /heart rate|\bhr\b|pulse|blood pressure|\bbp\b|\d{2,3}\/\d{2,3}|tachy|brady|perfus|cap(illary)? refill|\bcrt\b|hypotens|hypertens|\baf\b|atrial|rhythm|h(a)?emoglobin|\bhb\b|\bhgb\b|bleed|transfus|o(e)?dema|troponin|lactate|sepsis/,
  D: /alert|orient|confus|delirium|\bgcs\b|drows|neuro|\bpain\b|sedat|agitat|mental status|calm|restrain|headache|dizz/,
  E: /fever|febrile|\btemp|wound|incision|port sites?|skin|rash|redness|erythema|cellulitis|swelling|drain|dressing|\bpicc\b|cannula site|pressure (area|injur)|cultures?|infect|antibiotic|cephalexin|amoxicillin|ertapenem/,
  F: /fluid|\biv\b|drip|eating|drinking|diet|appetite|nause|vomit|bowel|stool|urine|voiding|catheter|output|intake|net (negative|positive)|euvol|creatinine|kidney|renal|potassium|sodium|electrolyte|lasix|furosemide|diure/,
  G: /glucose|sugars?\b|\bbsl\b|\bbgl\b|insulin|glargine|lispro|hypoglyc|hyperglyc|a1c|ketone|anion gap|closed (his|her|the) gap|diabet/,
}

function assess(clauses: string[]): Assessment {
  const out = emptyAssessment()
  const found: Record<AGKey, string[]> = { A: [], B: [], C: [], D: [], E: [], F: [], G: [] }
  for (const c of clauses) {
    const lower = c.toLowerCase()
    for (const k of agKeys) if (agPatterns[k].test(lower) && found[k].length < 2 && !found[k].includes(c)) found[k].push(c)
  }
  for (const k of agKeys) {
    const text = found[k].map((c, i) => (i ? lowerFirst(clip(c, 12)) : clip(c, 12))).join("; ")
    out[k] = text.charAt(0).toUpperCase() + text.slice(1)
  }
  return out
}

// Topics clinicians talk about on discharge rounds. `clinical` topics describe
// how the patient is doing; the rest are logistics.
const topics: Topic[] = [
  { label: "Breathing", pattern: /breath|dyspnea|short of breath|\bsob\b|wheez|cough|sats?\b|saturat|spo2|o2 sat|liters?\b|\d\s?l\b|nasal cannula|room air/, clinical: true },
  { label: "Vitals", pattern: /fever|afebrile|temp|blood pressure|\bbp\b|heart rate|tachy|brady|vitals|hypotens|hypertens/, clinical: true },
  { label: "Pain", pattern: /\bpain\b|sore|ache|hurts?|tylenol|oxycodone|analges/, clinical: true },
  { label: "Glucose", pattern: /glucose|sugars?\b|a1c|hypoglyc|hyperglyc|insulin/, clinical: true },
  { label: "Labs", pattern: /\blabs?\b|anion gap|closed (his|her|the) gap|ketones|bicarb|creatinine|potassium|sodium|hemoglobin|\bhgb\b|white count|\bwbc\b|culture|troponin|\binr\b|bmp|cbc/, clinical: true },
  { label: "Mental status", pattern: /confus|orient|delirium|alert|sleep|agitat|mental status/, clinical: true },
  { label: "Nutrition", pattern: /eating|appetite|tolerating|diet|nausea|vomit|bowel|stool/, clinical: true },
  { label: "Wound", pattern: /wound|incision|dressing|drain|staples|sutures/, clinical: true },
  { label: "Overall", pattern: /feel(s|ing)? (much |a lot |a bit )?(better|worse|good|great|okay|well)|improv|worse|stable|comfortable|no new|unchanged|resolved|redness|swelling|net negative|euvolem/, clinical: true },
  { label: "Oxygen", pattern: /oxygen|concentrator|\bo2\b|tank|\bdme\b|equipment/ },
  { label: "Mobility", pattern: /\bpt\b|physical therap|walk|ambulat|mobility|stairs|gait|walker|cane|transfer/ },
  { label: "Medications", pattern: /medication|meds\b|prescription|pharmacy|reconcil|dose|inhaler|antibiotic|anticoag|warfarin|eliquis/ },
  { label: "Education", pattern: /teach|educat|explain|review(ed)? (the|his|her)|demonstrat|understand/ },
  { label: "Transport", pattern: /pick (him|her|them)? ?up|ride|transport|drive|daughter|son|wife|husband|family|caregiver/ },
  { label: "Follow-up", pattern: /follow[- ]?up|appointment|clinic|pulmonolog|cardiolog|endocrin|pcp|primary care/ },
  { label: "Placement", pattern: /\bsnf\b|skilled nursing|rehab|placement|prior auth|authorization|bed offer|accept/ },
  { label: "Home services", pattern: /home health|visiting nurse|home infusion|services/ },
  { label: "Paperwork", pattern: /discharge summary|paperwork|forms?\b|note|document/ },
]

const doneCue =
  /\b(done|completed?|finished|cleared|confirmed|arranged|delivered|signed|scheduled|booked|sent|faxed|approved|placed|walked|ambulated|taught|reviewed|received|got (the|his|her)|came back|is in|are in|went over|picked up)\b/
const pendingCue =
  /\b(waiting|pending|still (need|waiting|hasn't|haven't|no|not)|not yet|haven't|hasn't|need(s)? to|has to|have to|holding|blocked|until|no word|no answer|follow up on|chase|check on|make sure|please)\b/
// Statements that ask for something to be done (vs. report what happened).
const actionCue =
  /^(please|let's|lets|we'll|we will|we should|order|schedule|call|set up|get|arrange|have|book|send|check|recheck|repeat|confirm|make sure|consult|refer|start|stop|hold|review|go over|nurse to|pharmacy to|case management to|pt to)\b|\b(let's|lets|please|should|will need|need(s)? to|we need|going to need|plan to|recommend|to (do|check|send|set up|go over|book|submit))\b/
const conditional = /\b(once|if|until|as soon as|when)\b/
// "not done", "hasn't been sent", "didn't walk" — negates a completion.
const negation = /\b(not|never)\s+(yet\s+)?(been\s+)?\w+|n't\s+(been\s+|yet\s+)?\w+/
const timingCue =
  /\b(today|tomorrow|tonight|this (morning|afternoon|evening)|(after|by|before|at) (lunch|noon|\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)|monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|in (\d+|a|two|three) (hours?|days?)|\d+ ?(am|pm))\b/
const dischargeCue = /discharg|go(ing)? home|send (him|her|them) home|leave|out of here|ready/
const raiseCue = /\b(urgent|asap|priority|first thing|right away|stat|before (noon|lunch)|this morning|critical|can't go without)\b/
const lowerCue = /\b(can wait|not urgent|low priority|outpatient|after discharge|no rush|next week)\b/
const smallTalk =
  /^(good (morning|afternoon)|hi|hello|hey|thank(s| you)|okay|ok|alright|all right|sounds good|great|perfect|yeah|yes|no|um+|uh+|so|bye|see you|how are you( doing)?( today)?)[\s,.!?]*$/

const stop = new Set(
  "a an the and or but to of for in on at by with from up is are was were be been being it its this that these those he she they him her them his their we our you your i me my do does did done not no yes so if as then than also just about into over after before more some any all can will would should could has have had there here what when who how which patient today daily".split(
    " ",
  ),
)

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9%\s]/g, " ")
    .split(/\s+/)
    .filter((w) => (w.length > 2 || /^(pt|ot|o2|rx|iv)$/.test(w)) && !stop.has(w))

const canonical: [RegExp, string][] = [
  [/^(walk|ambul)/, "ambul"],
  [/^(physical|pt$)/, "pt"],
  [/^(o2$|oxygen)/, "oxygen"],
  [/^(prescri|rx$)/, "rx"],
  [/^(teach|educat|instruct)/, "teach"],
  [/^(follow|appointment|clinic)/, "followup"],
  [/^(auth|prior)/, "auth"],
]
const stem = (w: string) => {
  for (const [re, c] of canonical) if (re.test(w)) return c
  return w.replace(/(ing|ed|es|s)$/, "")
}

/** Split a transcript into statements. Live capture adds one phrase per line. */
export function statements(text: string): string[] {
  const out: string[] = []
  const cleaned = text.replace(/\b(Mr|Mrs|Ms|Dr|St|[A-Z])\.(?=\s)/g, "$1")
  for (const raw of cleaned.split(/(?<=[.!?])\s+|\n+/)) {
    let s = raw.trim().replace(/^(so|and|um+|uh+|okay|ok|alright|yeah|well|also)[,\s]+/i, "")
    if (!s) continue
    // Long unpunctuated speech: break at clause joins.
    const parts = s.split(/\s+(?=(?:but|and then|also|so we|then we|and we|and she|and he)\s)/i)
    for (let p of parts) {
      p = p.trim().replace(/^(but|and then|also|so|and)\s+/i, "").replace(/[.,;\s]+$/, "")
      if (p.split(/\s+/).length < 2 || smallTalk.test(p.toLowerCase())) continue
      out.push(p.charAt(0).toUpperCase() + p.slice(1))
    }
  }
  return out
}

type Statement = {
  text: string
  lower: string
  topics: Topic[]
  task?: Task
  done: boolean
  pending: boolean
  action: boolean
  timing: boolean
}

function topicsOf(lower: string) {
  return topics.filter((t) => t.pattern.test(lower))
}

// Link a statement to the open checklist task it is most clearly about.
function linkTask(lower: string, stTopics: Topic[], open: Task[]): Task | undefined {
  const stWords = new Set(words(lower).map(stem))
  let best: { task: Task; score: number } | undefined
  for (const task of open) {
    const text = `${task.title} ${task.detail}`.toLowerCase()
    const shared = new Set(words(text).map(stem).filter((w) => stWords.has(w))).size
    const sameTopic = stTopics.some((t) => !t.clinical && t.pattern.test(text)) ? 1 : 0
    const score = shared + sameTopic
    if (score >= 2 && (!best || score > best.score)) best = { task, score }
  }
  return best?.task
}

const common = new Set(
  "patient he she they his her their we breathing pain still labs daughter son wife husband family oxygen sats vitals afebrile eating walking wound redness cultures confirm complete schedule send submit verify order arrange repeat document patient's he's she's".split(" "),
)
const lowerFirst = (s: string) => {
  const first = s.split(/\s/)[0].toLowerCase()
  return common.has(first) || stop.has(first) ? s.charAt(0).toLowerCase() + s.slice(1) : s
}
const clip = (s: string, n = 14) => {
  const w = s.split(/\s+/)
  return w.length > n ? `${w.slice(0, n).join(" ")}…` : s
}
const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
const shortTitle = (t: { title: string }) => (/^[A-Z][a-z]/.test(t.title) ? t.title.charAt(0).toLowerCase() + t.title.slice(1) : t.title)

export function summarizeLocally(p: Patient, transcript: string, notes: string): LocalSummary {
  const open = p.tasks.filter((t) => !t.completed)
  const sts: Statement[] = statements(`${transcript}\n${notes}`).map((text) => {
    const lower = text.toLowerCase()
    const stTopics = topicsOf(lower)
    const pending = pendingCue.test(lower)
    const action = actionCue.test(lower)
    const done = doneCue.test(lower) && !pending && !action && !conditional.test(lower) && !negation.test(lower)
    return { text, lower, topics: stTopics, task: linkTask(lower, stTopics, open), done, pending, action, timing: timingCue.test(lower) }
  })

  // Completed checklist items: a statement linked to a task that says it's done.
  const completed: LocalSummary["completed"] = []
  for (const s of sts)
    if (s.task && s.done && !completed.some((c) => c.taskId === s.task!.id))
      completed.push({ taskId: s.task.id, evidence: `“${clip(s.text, 20)}”` })
  const doneIds = new Set(completed.map((c) => c.taskId))

  // Urgency changes the team voiced for a linked open task.
  const urgency: LocalSummary["urgency"] = []
  for (const s of sts) {
    const t = s.task
    if (!t || doneIds.has(t.id) || urgency.some((u) => u.taskId === t.id)) continue
    if (raiseCue.test(s.lower) && t.urgency !== "High") urgency.push({ taskId: t.id, urgency: "High", reason: `“${clip(s.text, 20)}”` })
    else if (lowerCue.test(s.lower) && t.urgency === "High") urgency.push({ taskId: t.id, urgency: "Low", reason: `“${clip(s.text, 20)}”` })
  }

  // New action items: rule matches that no existing task covers, with the
  // statement that triggered them. Skip items the team said are already done.
  const newTasks: LocalSummary["newTasks"] = []
  for (const rule of extractionRules) {
    if (p.tasks.some((t) => rule.covers.test(t.title))) continue
    const s = sts.find((x) => rule.pattern.test(x.lower) && !x.task && (x.action || x.pending) && !x.done)
    if (!s) continue
    newTasks.push({ ...rule.task, evidence: `“${clip(s.text, 20)}”` })
  }

  // Clinical picture: statements about how the patient is doing.
  const clinical = sts.filter((s) => s.topics.some((t) => t.clinical) && !s.task && !s.pending && !s.action).slice(0, 2)
  // Remaining blockers: open high-priority tasks that weren't completed, plus
  // anything the team flagged as still pending.
  const pendingTasks = sts.filter((s) => s.task && (s.pending || s.action) && !doneIds.has(s.task.id)).map((s) => s.task!)
  const blockers = [...new Set([...pendingTasks, ...open.filter((t) => t.urgency === "High" && !doneIds.has(t.id))])].slice(0, 3)
  const unlinkedPending = sts.filter((s) => s.pending && !s.action && !s.task).slice(0, 1)
  const timing =
    sts.find((s) => s.timing && dischargeCue.test(s.lower)) ??
    sts.find((s) => s.timing && s.topics.some((t) => t.label === "Transport"))

  // Readiness once these changes are applied.
  const after: Patient = {
    ...p,
    tasks: [
      ...p.tasks.map((t) => (doneIds.has(t.id) ? { ...t, completed: true } : t)),
      ...newTasks.map((t, i) => ({ ...t, id: `new-${i}`, completed: false })),
    ],
  }
  const before = readiness(p)
  const projected = readiness(after)

  const points: string[] = []
  points.push(
    `${p.diagnosis}, hospital day ${p.los}${clinical.length ? ` — ${list(clinical.map((s) => lowerFirst(clip(s.text))))}` : ""}`,
  )
  if (completed.length) points.push(`Done since last round: ${list(completed.map((c) => shortTitle(p.tasks.find((t) => t.id === c.taskId)!)))}`)
  if (blockers.length) points.push(`Still blocking ${p.disposition.toLowerCase()}: ${list(blockers.map(shortTitle))}`)
  else if (unlinkedPending.length) points.push(`Still pending: ${lowerFirst(clip(unlinkedPending[0].text, 12))}`)
  else if (open.length === completed.length) points.push("No open checklist items remain")
  if (newTasks.length) points.push(`New from rounds: ${list(newTasks.map(shortTitle))}`)
  points.push(
    timing
      ? `Plan: ${lowerFirst(clip(timing.text.replace(/^(the )?plan (is )?(to )?/i, ""), 16))}`
      : `Plan: ${p.disposition.toLowerCase()}, target ${p.target}`,
  )
  if (!sts.some((s) => s.topics.length || s.task || s.action || s.pending))
    points.splice(1, 0, "Nothing discharge-related was captured on this round")

  // A–G from the clinical clauses (requests and checklist chatter are tasks, not assessment).
  const clauses = sts
    .filter((s) => !s.action && !(s.task && !s.topics.some((t) => t.clinical)))
    .flatMap((s) => s.text.split(/\s*[,;]\s*|\s+and\s+(?=(?:he|she|they|his|her|no|on|is|was|pain|sats?|bp|hr)\b)/i))
    .map((c) => c.trim())
    .filter(Boolean)
  const assessment = assess(clauses)

  // Findings: one short line per thing discussed, tied to the checklist where possible.
  const findings: string[] = []
  for (const s of sts) {
    if (findings.length >= 6) break
    let f: string
    if (s.task) f = `${s.task.title}: ${doneIds.has(s.task.id) ? "done" : s.pending ? "pending" : s.action ? "requested" : "discussed"}`
    else if (s.topics.length) f = `${s.topics[0].label}: ${lowerFirst(clip(s.text, 6))}`
    else continue
    if (!findings.some((x) => x.split(":")[0] === f.split(":")[0])) findings.push(f)
  }

  const statusAfter = status(after)
  const outlook = `${timing ? `${clip(timing.text, 16)} · ` : ""}${statusAfter} · readiness ${before}% → ${projected}% · target ${p.target}`

  return { summary: points, assessment, findings, outlook, newTasks, completed, urgency }
}
