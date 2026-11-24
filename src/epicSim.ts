// A simulated Epic chart that lives in this browser.
//
// ClearPath builds exactly the FHIR requests it would send to Epic's real API
// (see epic.ts) and this store answers them the way Epic does: an unsigned
// note waits for a clinician to sign, and a provisional problem waits in the
// holding area to be accepted or rejected. Nothing leaves the browser.

import type { Patient } from "./data"

const KEY = "clearpath-epic-sim"

export type SimStatus = "unsigned" | "signed" | "provisional" | "accepted" | "rejected"
export type SimItem = {
  id: string
  kind: "note" | "problem"
  title: string
  status: SimStatus
  at: number
  actedAt?: number
  actedBy?: string
  request: Record<string, unknown>
  response: Record<string, unknown>
}
export type SimChart = { fhirId: string; encounterId: string; items: SimItem[] }

type Store = Record<string, SimChart>

const read = (): Store => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store
  } catch {
    return {}
  }
}
const write = (s: Store) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // storage unavailable: the chart lasts for this page only
  }
}

/** Stable Epic-style ids for a ClearPath patient (FNV-1a, base 36). */
function fakeId(seed: string, len = 22) {
  let h = 2166136261
  let out = ""
  for (let round = 0; out.length < len; round++) {
    for (const ch of `${seed}:${round}`) {
      h ^= ch.charCodeAt(0)
      h = Math.imul(h, 16777619) >>> 0
    }
    out += h.toString(36)
  }
  return out.slice(0, len)
}

export function getChart(p: Patient): SimChart {
  return read()[p.id] ?? { fhirId: `e${fakeId(p.id)}`, encounterId: `e${fakeId(`${p.id}:enc`, 18)}`, items: [] }
}

function save(p: Patient, chart: SimChart) {
  const s = read()
  s[p.id] = chart
  write(s)
}

/** POST a resource to the simulated Epic, as `create()` does for the real one. */
export function simCreate(p: Patient, request: { resourceType: string; [k: string]: unknown }, title: string): SimItem {
  const chart = getChart(p)
  const now = Date.now()
  const id = `e${fakeId(`${p.id}:${request.resourceType}:${now}:${chart.items.length}`, 16)}`
  const kind = request.resourceType === "DocumentReference" ? "note" : "problem"
  const response = {
    ...request,
    id,
    meta: { versionId: "1", lastUpdated: new Date(now).toISOString() },
    ...(kind === "note" ? { status: "current", date: new Date(now).toISOString() } : { recordedDate: new Date(now).toISOString() }),
  }
  const item: SimItem = { id, kind, title, status: kind === "note" ? "unsigned" : "provisional", at: now, request, response }
  save(p, { ...chart, items: [item, ...chart.items] })
  return item
}

/** A clinician's action inside Epic: sign a note, or accept/reject a proposed problem. */
export function simAct(p: Patient, itemId: string, action: "sign" | "accept" | "reject", clinician: string): SimChart {
  const chart = getChart(p)
  const now = Date.now()
  const items = chart.items.map((it) => {
    if (it.id !== itemId) return it
    const version = String(Number((it.response.meta as { versionId?: string })?.versionId ?? "1") + 1)
    const meta = { versionId: version, lastUpdated: new Date(now).toISOString() }
    if (action === "sign")
      return {
        ...it,
        status: "signed" as const,
        actedAt: now,
        actedBy: clinician,
        response: { ...it.response, meta, docStatus: "final", authenticator: { display: clinician } },
      }
    const code = action === "accept" ? "confirmed" : "refuted"
    return {
      ...it,
      status: action === "accept" ? ("accepted" as const) : ("rejected" as const),
      actedAt: now,
      actedBy: clinician,
      response: {
        ...it.response,
        meta,
        verificationStatus: {
          coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code, display: code === "confirmed" ? "Confirmed" : "Refuted" }],
        },
      },
    }
  })
  const next = { ...chart, items }
  save(p, next)
  return next
}

export function simClear(p: Patient) {
  const s = read()
  delete s[p.id]
  write(s)
}
