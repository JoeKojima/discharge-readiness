// Epic public FHIR sandbox (fhir.epic.com), called straight from the browser.
//
// Sign-in is a SMART on FHIR standalone launch with PKCE for a public client
// (no secret, so it can live on GitHub Pages). The sandbox only holds Epic's
// fake test patients and is wiped every Sunday. Writes are deliberately ones a
// clinician must still act on: an unsigned ("preliminary") note and a
// provisional problem that lands in Epic's reconciliation queue.

export const EPIC_BASE = "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4"
const AUTHORIZE = "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize"
const TOKEN = "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token"

const CLIENT_KEY = "clearpath-epic-client" // localStorage: the non-production client ID
const PENDING_KEY = "clearpath-epic-pending" // sessionStorage: PKCE verifier + state during sign-in
const TOKEN_KEY = "clearpath-epic-token" // sessionStorage: access token (about an hour)
const ERROR_KEY = "clearpath-epic-error"

/** Epic's published sandbox test patients (fhir.epic.com/Documentation?docId=testpatients). */
export const sandboxPatients = [
  { id: "erXuFYUfucBZaryVksYEcMg3", name: "Camila Lopez" },
  { id: "eq081-VQEgP8drUUqCWzHfw3", name: "Derrick Lin" },
  { id: "eAB3mDIBBcyUKviyzrxsnAw3", name: "Desiree Powell" },
  { id: "egqBHVfQlt4Bw3XGXoxVxHg3", name: "Elijah Davis" },
  { id: "eIXesllypH3M9tAA5WdJftQ3", name: "Linda Ross" },
  { id: "e0w0LEDCYtfckT6N.CkJKCw3", name: "Warren McGinnis" },
]

export const noteTypes = [
  { code: "11506-3", name: "Progress note" },
  { code: "18842-5", name: "Discharge summary" },
  { code: "11488-4", name: "Consult note" },
]

export type EpicToken = { access_token: string; expires_at: number; scope?: string; patient?: string }

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn()
  } catch {
    return fallback
  }
}

/** Where Epic sends the user back: this page without the hash (Epic forbids fragments in redirect URIs). */
export const redirectUri = () => `${window.location.origin}${window.location.pathname}`

/**
 * ClearPath's own non-production app on fhir.epic.com, keyed by the redirect
 * URI it was registered with. A public client's ID isn't a secret; it only
 * works for these redirect URIs and Epic's sandbox.
 */
const builtInClients: Record<string, string> = {
  "https://joekojima.github.io/discharge-readiness/": "0f916b89-76b7-4e6f-878c-3bd66d5621ad",
}
export const builtInClientId = () => builtInClients[redirectUri()] ?? ""

export const getClientId = () => safe(() => localStorage.getItem(CLIENT_KEY) || builtInClientId(), builtInClientId())
export const setClientId = (id: string) => safe(() => localStorage.setItem(CLIENT_KEY, id.trim()), undefined)

export function getToken(): EpicToken | null {
  const t = safe(() => JSON.parse(sessionStorage.getItem(TOKEN_KEY) ?? "null") as EpicToken | null, null)
  return t && t.expires_at > Date.now() ? t : null
}
export const disconnect = () => safe(() => sessionStorage.removeItem(TOKEN_KEY), undefined)

/** Read and clear any error left by the last sign-in attempt. */
export function takeError(): string | null {
  const e = safe(() => sessionStorage.getItem(ERROR_KEY), null)
  if (e) safe(() => sessionStorage.removeItem(ERROR_KEY), undefined)
  return e
}

function randomString(bytes = 48) {
  const a = crypto.getRandomValues(new Uint8Array(bytes))
  return base64url(a)
}
function base64url(bytes: Uint8Array) {
  let s = ""
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** Start sign-in: send the browser to Epic's authorize page. */
export async function connect(returnHash: string) {
  const clientId = getClientId()
  if (!clientId) throw new Error("Add your non-production client ID first.")
  const verifier = randomString()
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))))
  const state = randomString(16)
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ verifier, state, returnHash, clientId, redirect: redirectUri() }))
  const q = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri(),
    scope: "openid fhirUser",
    state,
    aud: EPIC_BASE,
    code_challenge: challenge,
    code_challenge_method: "S256",
  })
  window.location.assign(`${AUTHORIZE}?${q}`)
}

/**
 * Finish sign-in when Epic redirects back with ?code=…&state=…. Runs once at
 * startup, before the hash router reads the URL.
 */
export async function completeSignIn() {
  const params = new URLSearchParams(window.location.search)
  if (!params.has("code") && !params.has("error")) return
  const pending = safe(() => JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? "null"), null) as
    | { verifier: string; state: string; returnHash: string; clientId: string; redirect: string }
    | null
  const back = (hash: string) => window.history.replaceState(null, "", `${window.location.pathname}${hash}`)
  safe(() => sessionStorage.removeItem(PENDING_KEY), undefined)
  if (!pending || params.get("state") !== pending.state) {
    sessionStorage.setItem(ERROR_KEY, "Epic sign-in couldn't be matched to this browser tab. Try connecting again.")
    back(pending?.returnHash ?? window.location.hash)
    return
  }
  if (params.has("error")) {
    sessionStorage.setItem(ERROR_KEY, `Epic sign-in failed: ${params.get("error_description") ?? params.get("error")}`)
    back(pending.returnHash)
    return
  }
  try {
    const res = await fetch(TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: params.get("code")!,
        redirect_uri: pending.redirect,
        client_id: pending.clientId,
        code_verifier: pending.verifier,
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error_description ?? body.error ?? `token request failed (${res.status})`)
    const token: EpicToken = {
      access_token: body.access_token,
      expires_at: Date.now() + (Number(body.expires_in) || 3600) * 1000 - 30_000,
      scope: body.scope,
      patient: body.patient,
    }
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token))
  } catch (e) {
    sessionStorage.setItem(ERROR_KEY, `Epic sign-in failed: ${e instanceof Error ? e.message : String(e)}`)
  }
  back(pending.returnHash)
}

export class EpicError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function fhir<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) throw new EpicError(401, "Not connected to Epic, or the session expired. Connect again.")
  const res = await fetch(`${EPIC_BASE}/${path}`, {
    ...init,
    headers: { Accept: "application/fhir+json", Authorization: `Bearer ${token.access_token}`, ...(init.headers ?? {}) },
  })
  const text = await res.text()
  const body = text ? safe(() => JSON.parse(text), { raw: text }) : {}
  if (!res.ok) {
    const issue = (body as { issue?: { diagnostics?: string; details?: { text?: string } }[] }).issue?.[0]
    const why = issue?.diagnostics ?? issue?.details?.text ?? `HTTP ${res.status}`
    const hint =
      res.status === 401
        ? " The session may have expired: connect again."
        : res.status === 403
          ? " Check that this API is selected on your fhir.epic.com app (new APIs can take up to an hour to sync)."
          : ""
    throw new EpicError(res.status, `${why}.${hint}`)
  }
  return body as T
}

type Bundle<R> = { entry?: { resource: R }[] }
export type FhirPatient = { id: string; name?: { text?: string; given?: string[]; family?: string }[]; birthDate?: string; gender?: string }
export type FhirEncounter = {
  id: string
  status?: string
  class?: { display?: string; code?: string }
  type?: { text?: string }[]
  period?: { start?: string; end?: string }
}

export const readPatient = (id: string) => fhir<FhirPatient>(`Patient/${encodeURIComponent(id)}`)

export async function searchEncounters(patientId: string) {
  const b = await fhir<Bundle<FhirEncounter>>(`Encounter?patient=${encodeURIComponent(patientId)}`)
  return (b.entry ?? [])
    .map((e) => e.resource)
    .filter((r) => r?.id)
    .sort((a, b) => (b.period?.start ?? "").localeCompare(a.period?.start ?? ""))
}

export const patientName = (p: FhirPatient) =>
  p.name?.[0]?.text ?? [p.name?.[0]?.given?.join(" "), p.name?.[0]?.family].filter(Boolean).join(" ") ?? p.id

const base64Utf8 = (s: string) => {
  const bytes = new TextEncoder().encode(s)
  let bin = ""
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

/** DocumentReference.Create (Clinical Notes): files an unsigned note a clinician signs in Epic. */
export function noteRequest(patientId: string, encounterId: string, loinc: string, text: string) {
  return {
    resourceType: "DocumentReference",
    docStatus: "preliminary",
    type: { coding: [{ system: "http://loinc.org", code: loinc, display: noteTypes.find((n) => n.code === loinc)?.name }] },
    subject: { reference: `Patient/${patientId}` },
    content: [{ attachment: { contentType: "text/plain", data: base64Utf8(text) } }],
    context: { encounter: [{ reference: `Encounter/${encounterId}` }] },
  }
}

/** Condition.Create (Problems): a provisional problem that waits for a clinician to reconcile it. */
export function problemRequest(patientId: string, icd10: string, display: string, onset: string) {
  return {
    resourceType: "Condition",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "problem-list-item", display: "Problem List Item" }] }],
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active", display: "Active" }] },
    verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "provisional", display: "Provisional" }] },
    code: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code: icd10, display }], text: display },
    subject: { reference: `Patient/${patientId}` },
    onsetDateTime: onset,
  }
}

export type Created = { id?: string; resourceType?: string; docStatus?: string; verificationStatus?: unknown; [k: string]: unknown }

export function create(resource: { resourceType: string }) {
  return fhir<Created>(resource.resourceType, {
    method: "POST",
    headers: { "Content-Type": "application/fhir+json", Prefer: "return=representation" },
    body: JSON.stringify(resource),
  })
}

export const readBack = (type: string, id: string) => fhir<Created>(`${type}/${encodeURIComponent(id)}`)
