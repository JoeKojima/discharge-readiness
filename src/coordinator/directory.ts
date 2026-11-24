// The coordinator's own directory of outside parties: post-acute facilities,
// payers, home-service vendors and transport. All names, numbers and
// statistics are fictional demo data.

export type Destination = "SNF" | "Acute rehab" | "LTCH" | "Home with services" | "Home"
export const destinations: Destination[] = ["SNF", "Acute rehab", "LTCH", "Home with services", "Home"]
export const facilityLevels: Destination[] = ["SNF", "Acute rehab", "LTCH"]

export type Need =
  | "Bariatric"
  | "Oxygen"
  | "IV antibiotics"
  | "Trach"
  | "Dialysis"
  | "Wound vac"
  | "TPN"
  | "1:1 supervision"
  | "Behavioral history"
export const needs: Need[] = [
  "Bariatric",
  "Oxygen",
  "IV antibiotics",
  "Trach",
  "Dialysis",
  "Wound vac",
  "TPN",
  "1:1 supervision",
  "Behavioral history",
]

export type PayerFamily = "Medicare" | "Medicare Advantage" | "Medicaid" | "Blue Cross" | "UnitedHealthcare" | "Cigna" | "Aetna"

/** Map a free-text coverage line to a payer family. */
export function payerFamily(coverage: string): PayerFamily {
  const c = coverage.toLowerCase()
  if (/medicare advantage|\bma\b/.test(c)) return "Medicare Advantage"
  if (/medicaid|medical assistance/.test(c)) return "Medicaid"
  if (/medicare/.test(c)) return "Medicare"
  if (/blue cross|bcbs|ibx|highmark/.test(c)) return "Blue Cross"
  if (/united/.test(c)) return "UnitedHealthcare"
  if (/cigna/.test(c)) return "Cigna"
  return "Aetna"
}

export type Facility = {
  id: string
  name: string
  levels: Destination[]
  miles: number
  capabilities: Need[]
  payers: PayerFamily[]
  /** Share of referrals accepted over the last 6 months. */
  acceptRate: number
  /** Typical hours to answer a referral. */
  responseHours: number
  fax: string
  email: string
  /** The fax number on file is out of date (the agent discovers this on send). */
  faxOutdated?: string
  /** Admission rules the patient's checklist must satisfy. */
  rules: string[]
}

const all: PayerFamily[] = ["Medicare", "Medicare Advantage", "Medicaid", "Blue Cross", "UnitedHealthcare", "Cigna", "Aetna"]

export const facilityDirectory: Facility[] = [
  {
    id: "harborview",
    name: "Harborview Post-Acute",
    levels: ["SNF"],
    miles: 2.8,
    capabilities: ["Bariatric", "Oxygen", "IV antibiotics", "Wound vac"],
    payers: ["Medicare", "Medicare Advantage", "Aetna", "Blue Cross"],
    acceptRate: 0.72,
    responseHours: 6,
    fax: "(215) 555-0140",
    email: "admissions@harborview.example",
    rules: ["24 hours restraint-free before admission"],
  },
  {
    id: "greenfield",
    name: "Greenfield Skilled Nursing",
    levels: ["SNF"],
    miles: 5.1,
    capabilities: ["Bariatric", "Wound vac", "Oxygen"],
    payers: ["Medicare", "Medicare Advantage", "Medicaid", "UnitedHealthcare"],
    acceptRate: 0.55,
    responseHours: 20,
    fax: "(215) 555-0177",
    faxOutdated: "(215) 555-0109",
    email: "referrals@greenfieldsnf.example",
    rules: ["48 hours restraint-free before admission"],
  },
  {
    id: "riverside",
    name: "Riverside Rehabilitation",
    levels: ["SNF", "Acute rehab"],
    miles: 4.4,
    capabilities: ["Oxygen", "IV antibiotics"],
    payers: ["Medicare", "Blue Cross", "Cigna", "UnitedHealthcare"],
    acceptRate: 0.48,
    responseHours: 9,
    fax: "(610) 555-0123",
    email: "intake@riversiderehab.example",
    rules: ["Able to tolerate 3 hours of therapy a day (acute rehab)"],
  },
  {
    id: "schuylkill",
    name: "Schuylkill Valley Care Center",
    levels: ["SNF"],
    miles: 8.6,
    capabilities: ["Oxygen", "Dialysis", "Behavioral history"],
    payers: ["Medicare", "Medicaid", "Medicare Advantage"],
    acceptRate: 0.64,
    responseHours: 14,
    fax: "(610) 555-0191",
    email: "admit@schuylkillcare.example",
    rules: ["Behavior plan documented for 2–3 days"],
  },
  {
    id: "liberty",
    name: "Liberty Bell Nursing & Rehab",
    levels: ["SNF"],
    miles: 3.9,
    capabilities: ["Oxygen", "IV antibiotics", "Trach"],
    payers: ["Medicare", "Medicaid", "Aetna", "Cigna"],
    acceptRate: 0.41,
    responseHours: 30,
    fax: "(215) 555-0155",
    email: "admissions@libertybellrehab.example",
    rules: [],
  },
  {
    id: "magee",
    name: "Delaware Valley Acute Rehab Institute",
    levels: ["Acute rehab"],
    miles: 3.2,
    capabilities: ["Oxygen", "Wound vac"],
    payers: ["Medicare", "Medicare Advantage", "Blue Cross", "Aetna", "UnitedHealthcare"],
    acceptRate: 0.6,
    responseHours: 8,
    fax: "(215) 555-0168",
    email: "referrals@dvari.example",
    rules: ["Able to tolerate 3 hours of therapy a day", "PT/OT notes within 24 hours"],
  },
  {
    id: "bryn",
    name: "Main Line Rehabilitation Hospital",
    levels: ["Acute rehab"],
    miles: 9.7,
    capabilities: ["Oxygen", "IV antibiotics", "Bariatric"],
    payers: ["Medicare", "Blue Cross", "Cigna", "Aetna"],
    acceptRate: 0.52,
    responseHours: 16,
    fax: "(610) 555-0136",
    faxOutdated: "(610) 555-0100",
    email: "admissions@mainlinerehab.example",
    rules: ["PT/OT notes within 24 hours"],
  },
  {
    id: "kensington",
    name: "Kensington Specialty Hospital",
    levels: ["LTCH"],
    miles: 4.8,
    capabilities: ["Trach", "TPN", "IV antibiotics", "Wound vac", "Dialysis", "Bariatric", "Oxygen"],
    payers: all,
    acceptRate: 0.58,
    responseHours: 12,
    fax: "(215) 555-0184",
    email: "intake@kensingtonsh.example",
    rules: ["Ventilator weaning or complex medical need documented"],
  },
]

export type Payer = {
  family: PayerFamily
  /** Where prior auth is submitted. */
  portal: string
  /** Typical decision time in hours. */
  turnaroundHours: number
  /** Whether a post-acute admission needs prior auth. */
  needsAuth: (d: Destination) => boolean
}

export const payers: Record<PayerFamily, Payer> = {
  Medicare: { family: "Medicare", portal: "No portal (Traditional Medicare)", turnaroundHours: 0, needsAuth: () => false },
  "Medicare Advantage": { family: "Medicare Advantage", portal: "naviHealth portal", turnaroundHours: 48, needsAuth: (d) => d !== "Home" },
  Medicaid: { family: "Medicaid", portal: "PA HealthChoices MCO portal", turnaroundHours: 72, needsAuth: (d) => d !== "Home" },
  "Blue Cross": { family: "Blue Cross", portal: "Availity", turnaroundHours: 36, needsAuth: (d) => d !== "Home" },
  UnitedHealthcare: { family: "UnitedHealthcare", portal: "UHC Provider Portal", turnaroundHours: 48, needsAuth: (d) => d !== "Home" },
  Cigna: { family: "Cigna", portal: "eviCore", turnaroundHours: 40, needsAuth: (d) => d !== "Home" },
  Aetna: { family: "Aetna", portal: "Availity", turnaroundHours: 48, needsAuth: (d) => d !== "Home" },
}

export type Vendor = {
  id: string
  name: string
  kind: "dme" | "homehealth" | "infusion" | "transport" | "dialysis"
  payers: PayerFamily[]
  responseHours: number
  phone: string
}

export const vendors: Vendor[] = [
  { id: "keystone-dme", name: "Keystone Medical Supply", kind: "dme", payers: all, responseHours: 2, phone: "(215) 555-0201" },
  { id: "penn-o2", name: "Liberty Oxygen & Respiratory", kind: "dme", payers: all, responseHours: 1.5, phone: "(215) 555-0202" },
  { id: "hh-visiting", name: "Visiting Nurse Partners", kind: "homehealth", payers: all, responseHours: 5, phone: "(215) 555-0210" },
  { id: "hh-bayada", name: "Brightway Home Health", kind: "homehealth", payers: ["Medicare", "Medicare Advantage", "Blue Cross", "Aetna", "Cigna"], responseHours: 3, phone: "(215) 555-0211" },
  { id: "hh-care", name: "CityCare Home Services", kind: "homehealth", payers: ["Medicare", "Medicaid", "UnitedHealthcare", "Cigna"], responseHours: 8, phone: "(215) 555-0212" },
  { id: "inf-option", name: "Optima Home Infusion", kind: "infusion", payers: all, responseHours: 6, phone: "(215) 555-0220" },
  { id: "tx-ambulance", name: "Metro BLS Ambulance", kind: "transport", payers: all, responseHours: 1, phone: "(215) 555-0230" },
  { id: "tx-wheelchair", name: "Center City Wheelchair Van", kind: "transport", payers: all, responseHours: 1, phone: "(215) 555-0231" },
  { id: "dial-north", name: "North Philly Dialysis Center", kind: "dialysis", payers: all, responseHours: 10, phone: "(215) 555-0240" },
]

export type Match = { facility: Facility; score: number; reasons: string[]; excluded?: string }

/** Facility matching (Tier 1 #7): level of care, capabilities, insurance, then rank by acceptance history and distance. */
export function matchFacilities(destination: Destination, required: Need[], coverage: string): Match[] {
  const payer = payerFamily(coverage)
  return facilityDirectory
    .filter((f) => f.levels.includes(destination))
    .map((f) => {
      const missing = required.filter((n) => !f.capabilities.includes(n))
      if (missing.length) return { facility: f, score: 0, reasons: [], excluded: `Can't take: ${missing.join(", ")}` }
      if (!f.payers.includes(payer)) return { facility: f, score: 0, reasons: [], excluded: `Out of network for ${payer}` }
      const score = Math.round(f.acceptRate * 70 + Math.max(0, 30 - f.miles * 2.5))
      const reasons = [
        `In network for ${payer}`,
        required.length ? `Takes ${required.join(", ")}` : "No special care needs",
        `Accepts ${Math.round(f.acceptRate * 100)}% of referrals`,
        `${f.miles} mi away · answers in ~${f.responseHours} h`,
      ]
      return { facility: f, score, reasons }
    })
    .sort((a, b) => Number(!!a.excluded) - Number(!!b.excluded) || b.score - a.score)
}
