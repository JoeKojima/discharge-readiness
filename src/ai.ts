import type AnthropicType from "@anthropic-ai/sdk"
import type { Patient, Task, Urgency } from "./data"
import { extractTasks, readiness, status } from "./logic"

export type AiMode = "rules" | "key" | "proxy"

export type AiSettings = {
  mode: AiMode
  apiKey: string
  proxyUrl: string
  accessCode: string
}

export const defaultAiSettings: AiSettings = { mode: "rules", apiKey: "", proxyUrl: "", accessCode: "" }

export const owners = [
  "Dr. Chen",
  "Nursing",
  "Case Management",
  "Social Work",
  "Physical Therapy",
  "Occupational Therapy",
  "Respiratory Therapy",
  "Clinical Pharmacy",
  "Unit Coordinator",
  "Vascular Access",
] as const

export const categories = ["Clinical", "Coordination", "Education", "Documentation"] as const

export type TaskDraft = Omit<Task, "id" | "completed"> & { evidence: string }

export type RoundsSummary = {
  engine: "claude" | "rules"
  summary: string
  findings: string[]
  outlook: string
  newTasks: TaskDraft[]
  completed: { taskId: string; evidence: string }[]
  urgency: { taskId: string; urgency: Urgency; reason: string }[]
}

export const MODEL = "claude-opus-5-5"

export function aiReady(ai: AiSettings) {
  if (ai.mode === "key") return ai.apiKey.trim().length > 0
  if (ai.mode === "proxy") return /^https:\/\//.test(ai.proxyUrl.trim())
  return false
}

const SYSTEM = `You are the discharge-planning assistant on an inpatient hospital medicine team. During rounds an ambient microphone records the team's conversation at the bedside. When the round for a patient ends you receive that transcript (speech-to-text, so expect missing punctuation, misheard drug names and cross-talk), any typed clinical notes, and the patient's current discharge checklist.

Your job is to turn the round into an accurate update of the discharge checklist:

1. summary: 2-4 sentences in the voice of a concise clinical handoff. Cover where the patient stands clinically, what is blocking discharge, and the plan. This replaces the summary shown on the patient's dashboard.
2. findings: 3-6 short phrases (2-5 words each) naming the concrete discharge-relevant facts the team discussed, such as "Ambulated 150 ft with PT" or "Insulin teaching pending".
3. outlook: one short sentence on discharge timing as the team described it.
4. newTasks: action items the team said need to happen before or for discharge that are not already on the checklist. Only include work that was actually discussed; never invent tasks from general best practice. If an existing open task already covers the item, do not add it again. Write the title as a short imperative (under 8 words) and the detail as one sentence with the specifics that were said (doses, times, names, distances). Pick the owner from the allowed list who would normally do the work. Urgency: High if it blocks discharge today or is a safety issue, Medium if needed before discharge, Low otherwise. effort is a rough time like "15 min". due is a short phrase like "Due today", "Before discharge", "Due by 2:00 PM" or "Due tomorrow". evidence is a short quote or paraphrase from the transcript or notes that supports the task.
5. completed: existing open tasks that the transcript or notes clearly say are already done. Use the task id exactly as given. Only include a task when completion is stated, not implied or planned.
6. urgency: existing open tasks whose urgency should change because of what was said, with the new urgency and a short reason. Leave this empty unless the conversation clearly changes priority.

Clinicians will review every change before it is applied, so prefer leaving something out over guessing. If the transcript is empty or unrelated to this patient, return empty lists and say so in the summary.`

const taskSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "detail", "owner", "category", "urgency", "effort", "due", "evidence"],
  properties: {
    title: { type: "string" },
    detail: { type: "string" },
    owner: { type: "string", enum: [...owners] },
    category: { type: "string", enum: [...categories] },
    urgency: { type: "string", enum: ["High", "Medium", "Low"] },
    effort: { type: "string" },
    due: { type: "string" },
    evidence: { type: "string" },
  },
}

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "findings", "outlook", "newTasks", "completed", "urgency"],
  properties: {
    summary: { type: "string" },
    findings: { type: "array", items: { type: "string" } },
    outlook: { type: "string" },
    newTasks: { type: "array", items: taskSchema },
    completed: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["taskId", "evidence"],
        properties: { taskId: { type: "string" }, evidence: { type: "string" } },
      },
    },
    urgency: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["taskId", "urgency", "reason"],
        properties: {
          taskId: { type: "string" },
          urgency: { type: "string", enum: ["High", "Medium", "Low"] },
          reason: { type: "string" },
        },
      },
    },
  },
}

function patientContext(p: Patient) {
  return JSON.stringify(
    {
      name: p.name,
      age: p.age,
      sex: p.sex,
      room: p.room,
      diagnosis: p.diagnosis,
      lengthOfStayDays: p.los,
      targetDischarge: p.target,
      disposition: p.disposition,
      insurance: p.coverage,
      dischargePlan: p.plan,
      readinessPercent: readiness(p),
      checklist: p.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        detail: t.detail,
        owner: t.owner,
        urgency: t.urgency,
        status: t.completed ? "done" : "open",
      })),
    },
    null,
    2,
  )
}

export class AiError extends Error {}

// The SDK is loaded on demand so it isn't in the initial page bundle.
async function sdk() {
  return (await import("@anthropic-ai/sdk")).default
}

function client(Anthropic: typeof AnthropicType, ai: AiSettings) {
  const proxy = ai.mode === "proxy"
  return new Anthropic({
    // In proxy mode the proxy adds the real key; the SDK still needs a placeholder.
    apiKey: proxy ? "proxy-supplies-key" : ai.apiKey.trim(),
    baseURL: proxy ? ai.proxyUrl.trim().replace(/\/+$/, "") : undefined,
    // The key is the user's own, kept only in their browser (or held by their proxy).
    dangerouslyAllowBrowser: true,
    defaultHeaders: proxy && ai.accessCode ? { "x-clearpath-code": ai.accessCode } : undefined,
    maxRetries: 1,
  })
}

function explain(Anthropic: typeof AnthropicType | undefined, err: unknown): AiError {
  if (err instanceof AiError) return err
  if (!Anthropic) return new AiError("Couldn't load the AI client. Check your connection.")
  if (err instanceof Anthropic.AuthenticationError)
    return new AiError("The API key or proxy access code was rejected. Check Settings → AI rounds summarizer.")
  if (err instanceof Anthropic.PermissionDeniedError)
    return new AiError("Access denied. Check the API key, or the proxy's access code, in Settings.")
  if (err instanceof Anthropic.RateLimitError) return new AiError("Rate limited by the API. Wait a minute and try again.")
  if (err instanceof Anthropic.APIConnectionError)
    return new AiError("Couldn't reach the AI service. Check your connection and the proxy URL in Settings.")
  if (err instanceof Anthropic.APIError) return new AiError(`AI request failed (${err.status ?? "error"}): ${err.message}`)
  return new AiError(err instanceof Error ? err.message : "AI request failed.")
}

async function summarizeWithClaude(p: Patient, transcript: string, notes: string, ai: AiSettings): Promise<RoundsSummary> {
  let Anthropic: typeof AnthropicType | undefined
  try {
    Anthropic = await sdk()
    const stream = client(Anthropic, ai).beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema } },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `<patient>\n${patientContext(p)}\n</patient>\n\n<rounds_transcript>\n${transcript.trim() || "(empty)"}\n</rounds_transcript>\n\n<clinical_notes>\n${notes.trim() || "(none)"}\n</clinical_notes>`,
        },
      ],
    })
    const msg = await stream.finalMessage()
    if (msg.stop_reason === "refusal") throw new AiError("The AI declined to summarize this round. Edit the transcript and try again.")
    if (msg.stop_reason === "max_tokens") throw new AiError("The AI response was cut off. Try a shorter transcript.")
    const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("")
    const out = JSON.parse(text) as Omit<RoundsSummary, "engine">
    return sanitize({ ...out, engine: "claude" }, p)
  } catch (err) {
    throw explain(Anthropic, err)
  }
}

// Drop references to tasks that don't exist or are already done.
function sanitize(s: RoundsSummary, p: Patient): RoundsSummary {
  const open = new Map(p.tasks.filter((t) => !t.completed).map((t) => [t.id, t]))
  const completed = s.completed.filter((c, i, all) => open.has(c.taskId) && all.findIndex((x) => x.taskId === c.taskId) === i)
  const done = new Set(completed.map((c) => c.taskId))
  return {
    ...s,
    findings: s.findings.slice(0, 6),
    completed,
    urgency: s.urgency.filter((u) => open.has(u.taskId) && !done.has(u.taskId) && open.get(u.taskId)!.urgency !== u.urgency),
  }
}

// Offline fallback: the built-in keyword rules, no network call.
function summarizeWithRules(p: Patient, transcript: string, notes: string): RoundsSummary {
  const added = extractTasks(`${transcript}\n${notes}`, p.tasks, p.id)
  const open = p.tasks.filter((t) => !t.completed).length
  const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  return {
    engine: "rules",
    summary: `${p.name} (${p.age}${p.sex}, ${p.diagnosis}). ${words ? `Rounds captured ${words} words` : "No transcript captured"}${notes.trim() ? " plus clinical notes" : ""}. ${open} checklist item${open === 1 ? "" : "s"} open; ${added.length} new action item${added.length === 1 ? "" : "s"} found by keyword match. Connect the AI summarizer in Settings for a written summary.`,
    findings: added.map((t) => t.title),
    outlook: `${status(p)} · target ${p.target}`,
    newTasks: added.map(({ id: _id, completed: _c, ...t }) => ({ ...t, evidence: "Keyword match in transcript or notes" })),
    completed: [],
    urgency: [],
  }
}

export async function summarizeRounds(p: Patient, transcript: string, notes: string, ai: AiSettings) {
  if (aiReady(ai)) return summarizeWithClaude(p, transcript, notes, ai)
  await new Promise((r) => setTimeout(r, 700))
  return summarizeWithRules(p, transcript, notes)
}

export async function testConnection(ai: AiSettings) {
  let Anthropic: typeof AnthropicType | undefined
  try {
    Anthropic = await sdk()
    const msg = await client(Anthropic, ai).messages.create({
      model: MODEL,
      max_tokens: 64,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: "Reply with the single word: ready" }],
    })
    return msg.model
  } catch (err) {
    throw explain(Anthropic, err)
  }
}
