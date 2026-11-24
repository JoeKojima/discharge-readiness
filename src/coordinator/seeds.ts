import type { Patient } from "../data"
import { advance, approvePacket, startCoordination, type Coordination, type Profile } from "./engine"
import { payerFamily } from "./directory"

const HOUR = 3_600_000

/** Sensible profile defaults from what the app already knows about a patient. */
export function defaultProfile(p: Patient): Profile {
  const d = p.disposition.toLowerCase()
  const destination: Profile["destination"] = /skilled|snf|nursing facility/.test(d)
    ? "SNF"
    : /rehab/.test(d)
      ? "Acute rehab"
      : /ltach|ltch|long-term/.test(d)
        ? "LTCH"
        : /home health|services|infusion|oxygen/.test(d)
          ? "Home with services"
          : "Home"
  const text = `${p.diagnosis} ${p.notes} ${p.plan.map((x) => x.value).join(" ")} ${p.tasks.map((t) => t.title).join(" ")}`.toLowerCase()
  const needs: Profile["needs"] = []
  if (/bariatric|bmi 4/.test(text)) needs.push("Bariatric")
  if (/oxygen|\bo₂|\bo2\b|nasal cannula/.test(text)) needs.push("Oxygen")
  if (/ertapenem|iv antibiotic|picc|infusion/.test(text)) needs.push("IV antibiotics")
  if (/dialysis/.test(text)) needs.push("Dialysis")
  if (/trach/.test(text)) needs.push("Trach")
  const relation = /daughter/.test(text) ? "daughter" : /son\b/.test(text) ? "son" : /husband/.test(text) ? "husband" : /wife/.test(text) ? "wife" : "family"
  return {
    destination,
    zip: "19104",
    coverage: p.coverage,
    needs,
    family: { name: `${relation === "family" ? "Pat" : relation.charAt(0).toUpperCase() + relation.slice(1)} ${p.name.split(" ").pop()}`, relation, phone: "(215) 555-01" + String(p.mrn).slice(-2) },
    caregiverWindow: "Weekdays after 3 PM",
    dme: needs.includes("Oxygen") && destination.startsWith("Home") ? ["Home oxygen concentrator", "Portable tanks"] : [],
    homeServices: destination === "Home with services" ? ["Skilled nursing"] : [],
  }
}

const seedSetups: Record<string, { profile: (p: Patient) => Profile; approve: boolean; hours: number }> = {
  "robert-brown": {
    profile: (p) => ({ ...defaultProfile(p), needs: ["Bariatric"], family: { name: "Linda Brown", relation: "daughter", phone: "(215) 555-0111" } }),
    approve: true,
    hours: 5,
  },
  "walter-kim": {
    profile: (p) => ({ ...defaultProfile(p), destination: "Acute rehab", needs: [], family: { name: "Grace Kim", relation: "niece", phone: "(215) 555-0133" }, caregiverWindow: "Evenings" }),
    approve: false,
    hours: 1,
  },
  "grace-okafor": {
    profile: (p) => ({
      ...defaultProfile(p),
      destination: "Home with services",
      needs: ["IV antibiotics"],
      family: { name: "Daniel Okafor", relation: "son", phone: "(215) 555-0122" },
      caregiverWindow: "Afternoons",
      dme: ["IV pole"],
      homeServices: ["Skilled nursing"],
    }),
    approve: false,
    hours: 3,
  },
}

/** Demo coordinations already under way when the app first loads. */
export function seedCoordination(p: Patient, now = Date.now()): Coordination | undefined {
  const setup = seedSetups[p.id]
  if (!setup) return undefined
  const start = now - setup.hours * HOUR
  let c = startCoordination(p, setup.profile(p), start)
  if (setup.approve) c = approvePacket(c)
  return advance(c, now)
}

export { payerFamily }
