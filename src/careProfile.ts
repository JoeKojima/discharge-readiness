// The parts of a patient's discharge picture that live outside the physician's
// rounds: therapy (PT/OT/SLP) findings, the home situation, and social work.
// All names, addresses and findings here are synthetic demo data.

import type { Patient } from "./data"

export type Discipline = "pt" | "ot" | "slp"
export const disciplines: Discipline[] = ["pt", "ot", "slp"]
export type TherapyNote =
  | { status: "seen"; by: string; at: string; points: string[]; recommendation: string }
  | { status: "pending"; note: string }
  | { status: "not-referred" }

/** Empty string = nobody has asked yet. */
export type HomeSituation = { address: string; dwelling: string; support: string }

export type SocialKey = "psychosocial" | "dcplan" | "resources" | "insurance" | "goals" | "grief" | "collab"
export type SocialState = "done" | "na"

export const socialItems: { key: SocialKey; label: string; hint: string }[] = [
  { key: "psychosocial", label: "Psychosocial assessment & support", hint: "Coping, mental health, safety at home" },
  { key: "dcplan", label: "Discharge planning", hint: "Destination agreed with patient and family" },
  { key: "resources", label: "Resource navigation", hint: "Community services, home care packages, referrals" },
  { key: "insurance", label: "Insurance authorisation / Medicare application", hint: "Benefits checked, applications lodged" },
  { key: "goals", label: "Goals of care & legal support", hint: "Advance directive, power of attorney, capacity" },
  { key: "grief", label: "Grief & adjustment support", hint: "Loss of independence, bereavement" },
  { key: "collab", label: "Interdisciplinary collaboration", hint: "Plan shared with the team at huddle" },
]

export const disciplineLabel: Record<Discipline, string> = { pt: "Physical therapy", ot: "Occupational therapy", slp: "Speech-language pathology" }
export const disciplineShort: Record<Discipline, string> = { pt: "PT", ot: "OT", slp: "SLP" }
/** What each discipline is asked to assess when someone refers. */
export const referralDetail: Record<Discipline, string> = {
  pt: "Physical therapy to assess mobility and recommend a discharge destination.",
  ot: "Occupational therapy to assess self-care and recommend a discharge destination.",
  slp: "Speech-language pathology to assess swallowing, airway protection and communication, and recommend a safe diet.",
}

type CareProfile = {
  therapy: Record<Discipline, TherapyNote>
  home: HomeSituation
  social: Partial<Record<SocialKey, SocialState>>
}

const notReferred: TherapyNote = { status: "not-referred" }

const seeds: Record<string, CareProfile> = {
  "james-miller": {
    therapy: {
      pt: { status: "pending", note: "Ambulation check on 2 L due by 1:00 PM" },
      ot: notReferred,
      slp: { status: "pending", note: "Bedside swallow screen: coughing on thin liquids since the exacerbation" },
    },
    home: { address: "2210 Federal St, Apt 3B, Philadelphia, PA 19146", dwelling: "Second-floor apartment, 14 stairs, no lift", support: "Lives with daughter (works days)" },
    social: { psychosocial: "done", grief: "na" },
  },
  "elena-park": {
    therapy: { pt: notReferred, ot: notReferred, slp: notReferred },
    home: { address: "118 Iona Ave, Narberth, PA 19072", dwelling: "House, bedroom on the ground floor", support: "Lives with husband" },
    social: { psychosocial: "na", dcplan: "done", resources: "na", insurance: "na", goals: "na", grief: "na", collab: "done" },
  },
  "robert-brown": {
    therapy: {
      pt: {
        status: "seen",
        by: "Tom Hayes",
        at: "10:15 AM",
        points: ["Bed-to-chair transfer needs two-person assist", "Walked 15 ft with a bariatric walker before tiring"],
        recommendation: "Skilled nursing facility with daily PT",
      },
      ot: {
        status: "seen",
        by: "Nina Brooks",
        at: "11:00 AM",
        points: ["Moderate assist for lower-body dressing and toileting", "Needs a bariatric commode"],
        recommendation: "Skilled nursing facility",
      },
      slp: {
        status: "seen",
        by: "Ava Patel",
        at: "9:30 AM",
        points: ["Delayed swallow with wet voice on thin liquids; aspiration risk", "Safe on mildly thick liquids with chin tuck, upright 90° for meals"],
        recommendation: "Mechanical soft diet, mildly thick liquids; SLP follow-up at the facility",
      },
    },
    home: { address: "1630 S 9th St, Philadelphia, PA 19148", dwelling: "Third-floor walk-up apartment", support: "Lives alone; daughter Linda visits weekends" },
    social: { psychosocial: "done", dcplan: "done", collab: "done" },
  },
  "amina-shah": {
    therapy: {
      pt: {
        status: "seen",
        by: "Tom Hayes",
        at: "9:00 AM",
        points: ["Independent on the ward and on a flight of stairs", "SpO₂ 95% on room air after walking"],
        recommendation: "Home, no PT follow-up needed",
      },
      ot: notReferred,
      slp: notReferred,
    },
    home: { address: "5412 Larchwood Ave, Philadelphia, PA 19143", dwelling: "Row house, bedroom upstairs (12 steps)", support: "Lives with son" },
    social: { psychosocial: "done", dcplan: "done", grief: "na" },
  },
  "marcus-johnson": {
    therapy: { pt: notReferred, ot: notReferred, slp: notReferred },
    home: { address: "", dwelling: "", support: "Lives alone" },
    social: {},
  },
  "sofia-alvarez": {
    therapy: { pt: notReferred, ot: notReferred, slp: notReferred },
    home: { address: "2017 E Norris St, Philadelphia, PA 19125", dwelling: "Apartment with a lift", support: "Lives with partner" },
    social: { psychosocial: "na", grief: "na", goals: "na" },
  },
  "walter-kim": {
    therapy: {
      pt: {
        status: "seen",
        by: "Tom Hayes",
        at: "10:40 AM",
        points: ["Weight-bearing as tolerated; 25 ft with a walker, contact guard", "Can tolerate 3 hours of therapy a day"],
        recommendation: "Acute inpatient rehab",
      },
      ot: { status: "pending", note: "OT evaluation booked for 2:00 PM" },
      slp: notReferred,
    },
    home: { address: "7 Elkins Ave, Cheltenham, PA 19012", dwelling: "Two-storey house, only bathroom upstairs", support: "Lives with wife (82, limited mobility)" },
    social: { psychosocial: "done", goals: "done" },
  },
  "grace-okafor": {
    therapy: {
      pt: { status: "pending", note: "Strength and gait check before home with IV antibiotics" },
      ot: notReferred,
      slp: notReferred,
    },
    home: { address: "4925 Wynnefield Ave, Philadelphia, PA 19131", dwelling: "Single-storey house", support: "Lives with husband; son Daniel nearby" },
    social: { psychosocial: "done", dcplan: "done" },
  },
}

const blank: CareProfile = { therapy: { pt: notReferred, ot: notReferred, slp: notReferred }, home: { address: "", dwelling: "", support: "" }, social: {} }

/** Fill in therapy, home and social work for patients saved before these fields existed. */
export function withCareProfile(p: Patient): Patient {
  const s = seeds[p.id] ?? blank
  return {
    ...p,
    // Patients saved before SLP existed get the seed's SLP entry.
    therapy: p.therapy ? { ...p.therapy, slp: p.therapy.slp ?? structuredClone(s.therapy.slp) } : structuredClone(s.therapy),
    home: p.home ?? { ...s.home },
    social: p.social ?? { ...s.social },
  }
}

export const homeUnknown = (h?: HomeSituation) => !h || !h.address.trim() || !h.dwelling.trim() || !h.support.trim()
