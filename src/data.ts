export type Urgency = "High" | "Medium" | "Low"

export type Task = {
  id: string
  title: string
  detail: string
  owner: string
  due: string
  urgency: Urgency
  effort: string
  completed: boolean
  category: string
}

export type Barrier = {
  title: string
  level: "HIGH" | "MODERATE" | "LOW"
  detail: string
  icon: "alert" | "bed" | "document"
}

export type Patient = {
  id: string
  initials: string
  name: string
  age: number
  sex: "M" | "F"
  mrn: string
  room: string
  color: string
  diagnosis: string
  los: number
  target: string
  disposition: string
  baseline: number
  summary: string
  detected: string[]
  transcript: string
  notes: string
  careTeam: string[]
  confidence: string
  trend: number[]
  trendNote: string
  roundedAt: string | null
  coverage: string
  plan: { label: string; value: string }[]
  snf?: { barriers: Barrier[]; referralSentTo?: string }
  tasks: Task[]
}

export type Staff = {
  id: string
  initials: string
  name: string
  role: string
  color: string
  text: string
  pager: string
  online: boolean
}

export type Message = { from: "me" | "them"; text: string; time: string }

export type Thread = {
  id: string
  staffId: string
  patientId?: string
  subject: string
  unread: boolean
  messages: Message[]
}

export const staff: Staff[] = [
  { id: "LC", initials: "LC", name: "Dr. Lena Chen", role: "Attending", color: "#dce9ff", text: "#38567c", pager: "x4412", online: true },
  { id: "MR", initials: "MR", name: "Maya Rodriguez", role: "Case manager", color: "#e6ddfa", text: "#5d4a7e", pager: "x4430", online: true },
  { id: "TH", initials: "TH", name: "Tom Hayes", role: "Physical therapy", color: "#dcefe8", text: "#366556", pager: "x4471", online: true },
  { id: "PN", initials: "PN", name: "Priya Nair", role: "Clinical pharmacist", color: "#fff0d3", text: "#7a5414", pager: "x4458", online: false },
  { id: "DW", initials: "DW", name: "Derek Wu", role: "Respiratory therapy", color: "#e0f2fe", text: "#2b5d7d", pager: "x4466", online: true },
  { id: "KO", initials: "KO", name: "Kara Olsen", role: "Charge nurse", color: "#fde2ef", text: "#7d3b5b", pager: "x4400", online: true },
  { id: "SB", initials: "SB", name: "Sam Becker", role: "Social work", color: "#ffe4d7", text: "#7c4a33", pager: "x4489", online: false },
]

const t = (
  pid: string,
  n: number,
  title: string,
  detail: string,
  owner: string,
  due: string,
  urgency: Urgency,
  effort: string,
  category: string,
  completed = false,
): Task => ({ id: `${pid}-${n}`, title, detail, owner, due, urgency, effort, category, completed })

export const seedPatients: Patient[] = [
  {
    id: "james-miller",
    initials: "JM",
    name: "James Miller",
    age: 68,
    sex: "M",
    mrn: "204918",
    room: "4W · 412",
    color: "#d7e6ff",
    diagnosis: "COPD exacerbation",
    los: 3,
    target: "3:00 PM",
    disposition: "Home with oxygen",
    baseline: 58,
    summary:
      "Patient is clinically improved on 2L oxygen and eager to return home. Discharge depends on durable medical equipment confirmation and safe ambulation.",
    detected: [
      "Daughter can provide transport after 3 PM",
      "No new dyspnea overnight",
      "Patient has 14-day medication supply",
    ],
    transcript:
      "Patient feels much better today. Breathing comfortably on two liters. Daughter confirmed she can pick him up after three, but we are still waiting to hear from the oxygen company. Please have PT walk him once more before lunch. Review the new inhaler with both patient and daughter.",
    notes:
      "COPD exacerbation improving. SpO₂ 93% on 2L NC. Medically stable pending DME and mobility clearance.",
    careTeam: ["LC", "MR", "TH", "DW"],
    confidence: "Moderate, trending up",
    trend: [5, 7, 6, 9, 11, 13, 15, 18],
    trendNote: "+12% since morning rounds",
    roundedAt: "8:10 AM",
    coverage: "Aetna Medicare Advantage PPO",
    plan: [
      { label: "Destination", value: "Home with daughter" },
      { label: "Equipment", value: "Home O₂ concentrator, 2L" },
      { label: "Follow-up", value: "Pulmonology in 7–10 days" },
      { label: "Transport", value: "Daughter, after 3 PM" },
    ],
    tasks: [
      t("james-miller", 1, "Confirm home oxygen delivery", "Verify concentrator delivery window and backup tank availability.", "Case Management", "Due in 45 min", "High", "20 min", "Coordination"),
      t("james-miller", 2, "Complete medication reconciliation", "Review anticoagulant dosing and remove duplicate PRN orders.", "Dr. Chen", "Due by 11:30 AM", "High", "15 min", "Clinical"),
      t("james-miller", 3, "Patient ambulation assessment", "Document 50 ft walk with SpO₂ above 90% on 2L nasal cannula.", "Physical Therapy", "Due by 1:00 PM", "Medium", "30 min", "Clinical"),
      t("james-miller", 4, "Schedule pulmonary follow-up", "Book outpatient visit within 7–10 days of discharge.", "Unit Coordinator", "Due today", "Medium", "10 min", "Follow-up"),
      t("james-miller", 5, "Review inhaler technique", "Teach-back completed with patient and daughter present.", "Respiratory Therapy", "Completed 9:20 AM", "Low", "15 min", "Education", true),
      t("james-miller", 6, "Finalize discharge summary", "Hospital course and pending lab guidance documented.", "Dr. Chen", "Completed 8:45 AM", "Low", "20 min", "Documentation", true),
    ],
  },
  {
    id: "elena-park",
    initials: "EP",
    name: "Elena Park",
    age: 54,
    sex: "F",
    mrn: "189442",
    room: "4W · 408",
    color: "#e8ddff",
    diagnosis: "Laparoscopic cholecystectomy, POD 1",
    los: 2,
    target: "11:00 AM",
    disposition: "Home",
    baseline: 70,
    summary:
      "Uncomplicated post-op course. Tolerating a regular diet with pain controlled on oral medication. Ready once wound-care teaching is done.",
    detected: [
      "Husband will drive her home",
      "Pain 2/10 on oral acetaminophen",
      "Incisions clean, dry, intact",
    ],
    transcript:
      "Mrs. Park is eating breakfast and walking the halls. Pain is two out of ten. Husband is here and will drive her home. Nurse to go over wound care and showering instructions, and make sure the surgical clinic appointment is booked.",
    notes: "POD1 lap chole. Afebrile, tolerating regular diet. Incisions C/D/I.",
    careTeam: ["LC", "KO", "PN"],
    confidence: "High, stable",
    trend: [14, 15, 15, 16, 17, 17, 18, 18],
    trendNote: "Unchanged since morning rounds",
    roundedAt: "8:25 AM",
    coverage: "Blue Cross PPO",
    plan: [
      { label: "Destination", value: "Home" },
      { label: "Equipment", value: "None required" },
      { label: "Follow-up", value: "Surgery clinic in 2 weeks" },
      { label: "Transport", value: "Husband, at bedside" },
    ],
    tasks: [
      t("elena-park", 1, "Wound care and showering education", "Teach-back on incision care, signs of infection, and showering.", "Nursing", "Due by 10:30 AM", "Medium", "15 min", "Education"),
      t("elena-park", 2, "Schedule surgical follow-up", "Book surgery clinic visit in 2 weeks.", "Unit Coordinator", "Due today", "Low", "10 min", "Follow-up"),
      t("elena-park", 3, "Confirm diet tolerance", "Tolerated breakfast and lunch without nausea.", "Nursing", "Completed 9:05 AM", "Low", "5 min", "Clinical", true),
      t("elena-park", 4, "Transition to oral pain control", "Pain 2/10 on acetaminophen; IV opioids discontinued.", "Dr. Chen", "Completed 8:30 AM", "Medium", "10 min", "Clinical", true),
      t("elena-park", 5, "Complete medication reconciliation", "Home medications resumed; no new prescriptions needed.", "Clinical Pharmacy", "Completed 8:50 AM", "Medium", "10 min", "Clinical", true),
    ],
  },
  {
    id: "robert-brown",
    initials: "RB",
    name: "Robert Brown",
    age: 73,
    sex: "M",
    mrn: "227103",
    room: "4W · 416",
    color: "#ffe4d7",
    diagnosis: "CHF exacerbation, resolved delirium",
    los: 6,
    target: "Tomorrow 12:00 PM",
    disposition: "Skilled nursing facility",
    baseline: 25,
    summary:
      "Euvolemic on oral diuretics and delirium has cleared. Needs skilled nursing placement; admission depends on restraint-free documentation and bariatric equipment.",
    detected: [
      "Soft restraints discontinued 18 hours ago",
      "Family prefers a facility within 5 miles",
      "Weight down 4.2 kg since admission",
    ],
    transcript:
      "Mr. Brown is calm and oriented today, no restraints overnight. He's net negative and on oral Lasix now. He'll need skilled nursing, so case management should submit the prior auth today. Confirm Harborview has a bariatric bed and lift. Pharmacy to check the apixaban and Entresto are on their formulary.",
    notes:
      "HFrEF exacerbation, now euvolemic on PO furosemide. Delirium resolved; restraints discontinued 18h ago. BMI 41.",
    careTeam: ["LC", "MR", "SB", "PN", "TH"],
    confidence: "Low, improving",
    trend: [3, 4, 4, 5, 6, 7, 8, 10],
    trendNote: "+6% since morning rounds",
    roundedAt: "8:40 AM",
    coverage: "Aetna Medicare Advantage PPO",
    plan: [
      { label: "Destination", value: "Skilled nursing facility" },
      { label: "Equipment", value: "Bariatric bed and lift" },
      { label: "Follow-up", value: "Cardiology in 7 days" },
      { label: "Transport", value: "Wheelchair van" },
    ],
    snf: {
      barriers: [
        { title: "Restraint use documented", level: "HIGH", icon: "alert", detail: "Soft restraints discontinued 18 hours ago. Most facilities require 24–48 documented restraint-free hours before acceptance." },
        { title: "Bariatric equipment required", level: "MODERATE", icon: "bed", detail: "BMI 41; facility must confirm a bariatric bed, lift, and two-person transfer support." },
        { title: "High-cost medication review", level: "LOW", icon: "document", detail: "Apixaban and Entresto are on formulary at two of three facilities; Riverside requires pharmacy verification." },
      ],
    },
    tasks: [
      t("robert-brown", 1, "Document 24 hours restraint-free", "Nursing to chart restraint-free period through 2 PM today for SNF review.", "Nursing", "Due by 2:00 PM", "High", "10 min", "Documentation"),
      t("robert-brown", 2, "Submit prior authorization", "Send clinicals to payer for skilled nursing placement approval.", "Case Management", "Due by 12:00 PM", "High", "20 min", "Coordination"),
      t("robert-brown", 3, "Confirm bariatric bed and lift", "Verify equipment with Harborview admissions before transfer.", "Case Management", "Due today", "Medium", "15 min", "Coordination"),
      t("robert-brown", 4, "Formulary check for apixaban and Entresto", "Confirm coverage at the accepting facility pharmacy.", "Clinical Pharmacy", "Due today", "Medium", "15 min", "Clinical"),
      t("robert-brown", 5, "PT evaluation for transfer level", "Document two-person assist requirement for facility handoff.", "Physical Therapy", "Due by 3:00 PM", "Medium", "30 min", "Clinical"),
      t("robert-brown", 6, "Transition to oral diuretic", "Net negative 4.2 kg; switched to PO furosemide 40 mg BID.", "Dr. Chen", "Completed yesterday", "High", "10 min", "Clinical", true),
      t("robert-brown", 7, "Review echocardiogram", "EF 30%; no change to GDMT plan.", "Dr. Chen", "Completed yesterday", "Medium", "10 min", "Clinical", true),
    ],
  },
  {
    id: "amina-shah",
    initials: "AS",
    name: "Amina Shah",
    age: 61,
    sex: "F",
    mrn: "199327",
    room: "4W · 421",
    color: "#d5f3e6",
    diagnosis: "Community-acquired pneumonia",
    los: 4,
    target: "10:30 AM",
    disposition: "Home",
    baseline: 64,
    summary:
      "Afebrile for 48 hours on room air and transitioned to oral antibiotics. Only the discharge prescription is outstanding.",
    detected: [
      "Afebrile for 48 hours",
      "Ambulating independently on room air",
      "Son picking her up at 10 AM",
    ],
    transcript:
      "Ms. Shah is on room air, afebrile two days. She's on oral amoxicillin-clavulanate. Send the prescription to her pharmacy, her son is picking her up at ten.",
    notes: "CAP improving. SpO₂ 96% RA. Completing 7-day course PO.",
    careTeam: ["LC", "KO", "PN"],
    confidence: "High, trending up",
    trend: [10, 11, 13, 14, 15, 17, 18, 19],
    trendNote: "+8% since morning rounds",
    roundedAt: "7:55 AM",
    coverage: "Medicare Part A/B",
    plan: [
      { label: "Destination", value: "Home" },
      { label: "Equipment", value: "None required" },
      { label: "Follow-up", value: "PCP in 1 week, repeat CXR 6 weeks" },
      { label: "Transport", value: "Son, 10 AM" },
    ],
    tasks: [
      t("amina-shah", 1, "Send discharge prescriptions", "E-prescribe amoxicillin-clavulanate to complete a 7-day course.", "Dr. Chen", "Due by 10:00 AM", "High", "10 min", "Clinical"),
      t("amina-shah", 2, "Wean to room air", "SpO₂ 96% on room air at rest and with exertion.", "Respiratory Therapy", "Completed yesterday", "High", "10 min", "Clinical", true),
      t("amina-shah", 3, "Schedule PCP follow-up", "PCP visit booked for next Tuesday at 9 AM.", "Unit Coordinator", "Completed 8:15 AM", "Medium", "10 min", "Follow-up", true),
      t("amina-shah", 4, "Finalize discharge summary", "Hospital course and repeat chest X-ray guidance documented.", "Dr. Chen", "Completed 8:40 AM", "Low", "20 min", "Documentation", true),
    ],
  },
  {
    id: "marcus-johnson",
    initials: "MJ",
    name: "Marcus Johnson",
    age: 42,
    sex: "M",
    mrn: "231556",
    room: "4W · 403",
    color: "#fde2ef",
    diagnosis: "Diabetic ketoacidosis, resolved",
    los: 3,
    target: "4:00 PM",
    disposition: "Home",
    baseline: 40,
    summary:
      "Anion gap closed and transitioned to subcutaneous insulin. Discharge depends on insulin teaching, pen coverage, and an endocrinology follow-up.",
    detected: [
      "New basal-bolus insulin regimen",
      "Lives alone; works night shifts",
      "Ran out of insulin before admission due to cost",
    ],
    transcript:
      "Marcus closed his gap overnight and is on glargine and lispro now. He ran out of insulin because of cost, so pharmacy needs to check pen coverage. Diabetes educator should do insulin teaching with teach-back, and we need an endocrine follow-up. Send prescriptions once coverage is confirmed.",
    notes:
      "DKA resolved. Glargine 24 units nightly plus lispro sliding scale. A1c 11.2%.",
    careTeam: ["LC", "PN", "KO", "SB"],
    confidence: "Moderate, stable",
    trend: [8, 9, 9, 10, 10, 11, 11, 12],
    trendNote: "+3% since morning rounds",
    roundedAt: "9:05 AM",
    coverage: "Medicaid Managed Care",
    plan: [
      { label: "Destination", value: "Home (lives alone)" },
      { label: "Equipment", value: "Glucometer and pen needles" },
      { label: "Follow-up", value: "Endocrinology in 1–2 weeks" },
      { label: "Transport", value: "Rideshare voucher" },
    ],
    tasks: [
      t("marcus-johnson", 1, "Insulin teaching with teach-back", "Diabetes educator to cover pen use, hypoglycemia, and sick-day rules.", "Diabetes Educator", "Due by 1:00 PM", "High", "30 min", "Education"),
      t("marcus-johnson", 2, "Verify insulin pen coverage", "Confirm Medicaid formulary and copay to prevent another cost-related gap.", "Clinical Pharmacy", "Due by 12:00 PM", "High", "15 min", "Coordination"),
      t("marcus-johnson", 3, "Send discharge prescriptions", "Glargine, lispro, pen needles, glucometer, and test strips.", "Dr. Chen", "Due by 2:00 PM", "High", "10 min", "Clinical"),
      t("marcus-johnson", 4, "Schedule endocrinology follow-up", "Book a visit within 1–2 weeks of discharge.", "Unit Coordinator", "Due today", "Medium", "10 min", "Follow-up"),
      t("marcus-johnson", 5, "Transition to subcutaneous insulin", "Insulin drip stopped 2 hours after the first glargine dose.", "Dr. Chen", "Completed 6:00 AM", "High", "15 min", "Clinical", true),
      t("marcus-johnson", 6, "Social work assessment", "Medication cost assistance and food security screen done.", "Social Work", "Completed 9:30 AM", "Medium", "20 min", "Coordination", true),
    ],
  },
  {
    id: "sofia-alvarez",
    initials: "SA",
    name: "Sofia Alvarez",
    age: 35,
    sex: "F",
    mrn: "240118",
    room: "4W · 410",
    color: "#fff1c9",
    diagnosis: "Cellulitis, left lower leg",
    los: 2,
    target: "1:00 PM",
    disposition: "Home",
    baseline: 60,
    summary:
      "Erythema is receding within the marked borders on oral cephalexin. Afebrile, ambulating independently.",
    detected: [
      "Erythema receding inside the marked border",
      "Afebrile overnight",
      "Works from home; partner available",
    ],
    transcript:
      "Sofia's redness is well inside the line we drew. She's on oral cephalexin. Send the prescription and book a wound check in the clinic in 48 hours.",
    notes: "LLE cellulitis improving on PO cephalexin. Afebrile. WBC normalized.",
    careTeam: ["LC", "KO"],
    confidence: "High, trending up",
    trend: [9, 10, 12, 13, 14, 15, 16, 17],
    trendNote: "+10% since morning rounds",
    roundedAt: null,
    coverage: "UnitedHealthcare Choice Plus",
    plan: [
      { label: "Destination", value: "Home" },
      { label: "Equipment", value: "None required" },
      { label: "Follow-up", value: "Wound check in 48 hours" },
      { label: "Transport", value: "Partner" },
    ],
    tasks: [
      t("sofia-alvarez", 1, "Send discharge prescriptions", "Cephalexin 500 mg QID to complete a 7-day course.", "Dr. Chen", "Due by 12:00 PM", "Medium", "10 min", "Clinical"),
      t("sofia-alvarez", 2, "Schedule wound check", "Clinic visit in 48 hours to reassess erythema.", "Unit Coordinator", "Due today", "Low", "10 min", "Follow-up"),
      t("sofia-alvarez", 3, "Transition to oral antibiotics", "IV cefazolin stopped; first PO dose given at 8 AM.", "Dr. Chen", "Completed 8:00 AM", "High", "10 min", "Clinical", true),
      t("sofia-alvarez", 4, "Mark erythema borders", "Borders photographed and charted for comparison.", "Nursing", "Completed yesterday", "Low", "5 min", "Documentation", true),
      t("sofia-alvarez", 5, "Leg elevation education", "Teach-back on elevation and warning signs done.", "Nursing", "Completed 9:40 AM", "Low", "10 min", "Education", true),
    ],
  },
  {
    id: "walter-kim",
    initials: "WK",
    name: "Walter Kim",
    age: 81,
    sex: "M",
    mrn: "175230",
    room: "4W · 418",
    color: "#e0f2fe",
    diagnosis: "Hip fracture, s/p ORIF POD 2",
    los: 4,
    target: "Friday 10:00 AM",
    disposition: "Inpatient rehab",
    baseline: 20,
    summary:
      "Post-op day 2 after right hip ORIF. Pain is controlled, but mobility is limited and he needs a rehab bed. Hemoglobin is being trended after a post-op drop.",
    detected: [
      "Walked 20 ft with a walker and two-person assist",
      "Lives alone in a two-story home",
      "Hemoglobin 8.9, down from 10.4",
    ],
    transcript:
      "Mr. Kim walked twenty feet with the walker and PT. He lives alone with stairs, so he'll need acute rehab. Recheck labs this afternoon for hemoglobin. Case management to send rehab referrals, and we need the prior authorization started.",
    notes:
      "POD2 R hip ORIF. Hgb 8.9 from 10.4, asymptomatic. Enoxaparin prophylaxis. WBAT.",
    careTeam: ["LC", "TH", "MR", "SB"],
    confidence: "Low, stable",
    trend: [4, 4, 5, 5, 5, 6, 6, 6],
    trendNote: "+1% since morning rounds",
    roundedAt: null,
    coverage: "Medicare Part A/B + Medigap",
    plan: [
      { label: "Destination", value: "Acute inpatient rehab" },
      { label: "Equipment", value: "Walker, raised toilet seat" },
      { label: "Follow-up", value: "Orthopedics in 2 weeks" },
      { label: "Transport", value: "Wheelchair van" },
    ],
    tasks: [
      t("walter-kim", 1, "Send inpatient rehab referrals", "Refer to two acute rehab facilities with orthopedic programs.", "Case Management", "Due by 12:00 PM", "High", "20 min", "Coordination"),
      t("walter-kim", 2, "Repeat hemoglobin", "Recheck CBC this afternoon; transfuse if under 7.", "Dr. Chen", "Due by 4:00 PM", "High", "5 min", "Clinical"),
      t("walter-kim", 3, "Second PT session", "Progress gait distance and stair assessment.", "Physical Therapy", "Due by 2:00 PM", "Medium", "30 min", "Clinical"),
      t("walter-kim", 4, "Submit prior authorization", "Medicare rehab qualification documentation.", "Case Management", "Due today", "High", "20 min", "Coordination"),
      t("walter-kim", 5, "Complete home safety review", "Assess stairs, bathroom access, and caregiver support.", "Occupational Therapy", "Due tomorrow", "Medium", "20 min", "Clinical"),
      t("walter-kim", 6, "DVT prophylaxis plan", "Enoxaparin for 28 days post-op ordered.", "Dr. Chen", "Completed yesterday", "High", "10 min", "Clinical", true),
    ],
  },
  {
    id: "grace-okafor",
    initials: "GO",
    name: "Grace Okafor",
    age: 58,
    sex: "F",
    mrn: "212874",
    room: "4W · 425",
    color: "#ede9fe",
    diagnosis: "Pyelonephritis with sepsis",
    los: 5,
    target: "Tomorrow 9:00 AM",
    disposition: "Home with home health",
    baseline: 30,
    summary:
      "Sepsis has resolved and blood cultures are clear. A PICC is planned to finish IV ertapenem at home with home health nursing.",
    detected: [
      "Blood cultures negative × 48 hours",
      "Needs 7 more days of IV ertapenem",
      "Husband can learn line care",
    ],
    transcript:
      "Mrs. Okafor's cultures are negative and she's afebrile. She needs a PICC for home IV ertapenem. Case management to set up home health and home infusion. Repeat labs in the morning before discharge.",
    notes:
      "ESBL E. coli pyelonephritis, sepsis resolved. Plan: PICC and ertapenem 1 g daily to complete 10 days.",
    careTeam: ["LC", "MR", "PN", "KO"],
    confidence: "Moderate, trending up",
    trend: [6, 7, 8, 8, 10, 11, 12, 13],
    trendNote: "+7% since morning rounds",
    roundedAt: "9:20 AM",
    coverage: "Cigna Open Access",
    plan: [
      { label: "Destination", value: "Home with home health" },
      { label: "Equipment", value: "PICC and home infusion supplies" },
      { label: "Follow-up", value: "Infectious disease in 1 week" },
      { label: "Transport", value: "Husband" },
    ],
    tasks: [
      t("grace-okafor", 1, "PICC placement", "Vascular access team consult for a right-arm PICC.", "Vascular Access", "Due by 2:00 PM", "High", "45 min", "Clinical"),
      t("grace-okafor", 2, "Arrange home health referral", "Home nursing for line care and weekly labs.", "Case Management", "Due today", "High", "15 min", "Coordination"),
      t("grace-okafor", 3, "Home infusion pharmacy setup", "Ertapenem delivery and teaching scheduled.", "Clinical Pharmacy", "Due today", "Medium", "20 min", "Coordination"),
      t("grace-okafor", 4, "Infectious disease sign-off", "Duration and agent confirmed: ertapenem through day 10.", "Dr. Chen", "Completed 8:15 AM", "Medium", "10 min", "Clinical", true),
      t("grace-okafor", 5, "Review blood cultures", "Negative at 48 hours.", "Dr. Chen", "Completed 7:50 AM", "High", "5 min", "Clinical", true),
    ],
  },
]

export const seedThreads: Thread[] = [
  {
    id: "t-oxygen",
    staffId: "MR",
    patientId: "james-miller",
    subject: "Home oxygen for James Miller",
    unread: true,
    messages: [
      { from: "them", text: "Called Apria. They can deliver the concentrator between 1 and 3 PM today.", time: "9:42 AM" },
      { from: "them", text: "They'll leave a backup tank at the bedside for the ride home. Want me to lock it in?", time: "9:44 AM" },
    ],
  },
  {
    id: "t-walter-pt",
    staffId: "TH",
    patientId: "walter-kim",
    subject: "Walter Kim mobility",
    unread: true,
    messages: [
      { from: "them", text: "Walter did 20 ft with a walker and two-person assist this morning. I'll see him again at 1:30 to try stairs.", time: "10:05 AM" },
    ],
  },
  {
    id: "t-insulin",
    staffId: "PN",
    patientId: "marcus-johnson",
    subject: "Insulin coverage for Marcus Johnson",
    unread: true,
    messages: [
      { from: "them", text: "Medicaid covers Lantus SoloStar and Humalog KwikPen with a $3 copay each. Prior auth isn't needed.", time: "10:18 AM" },
    ],
  },
  {
    id: "t-snf",
    staffId: "SB",
    patientId: "robert-brown",
    subject: "SNF placement for Robert Brown",
    unread: false,
    messages: [
      { from: "them", text: "Harborview reviewed the packet. They need 24 hours of restraint-free documentation before they can accept.", time: "Yesterday" },
      { from: "me", text: "Restraints came off at 8 PM last night. Nursing is charting it.", time: "Yesterday" },
      { from: "them", text: "Perfect. I'll resend at 2 PM once we pass the 24-hour mark.", time: "Yesterday" },
    ],
  },
  {
    id: "t-huddle",
    staffId: "KO",
    subject: "Bed huddle at 2 PM",
    unread: false,
    messages: [
      { from: "them", text: "Reminder: discharge huddle at 2 PM in the 4W conference room. ED is holding 3 admits.", time: "7:30 AM" },
    ],
  },
]

export const facilities = [
  {
    name: "Harborview Post-Acute",
    distance: "2.8 miles",
    match: 94,
    rank: "Best clinical fit",
    availability: "Bed available today",
    patientCost: "$350",
    payerCost: "$8,680",
    hospitalCost: "$185",
    delayCost: "$0",
    specialties: ["Bariatric care", "Respiratory therapy", "Anticoagulation"],
    barrier: "Requires 24 hours restraint-free",
    note: "On-site respiratory therapy 7 days/week and bariatric equipment confirmed.",
  },
  {
    name: "Greenfield Skilled Nursing",
    distance: "5.1 miles",
    match: 86,
    rank: "Lowest patient cost",
    availability: "Bed in 1–2 days",
    patientCost: "$210",
    payerCost: "$7,560",
    hospitalCost: "$95",
    delayCost: "$2,450",
    specialties: ["Bariatric care", "Wound care", "Rehabilitation"],
    barrier: "Requires 48 hours restraint-free",
    note: "Preferred insurance tier, but respiratory therapy is available weekdays only.",
  },
  {
    name: "Riverside Rehabilitation",
    distance: "4.4 miles",
    match: 78,
    rank: "Alternate option",
    availability: "Bed available today",
    patientCost: "$1,260",
    payerCost: "$7,070",
    hospitalCost: "$140",
    delayCost: "$0",
    specialties: ["Pulmonary rehab", "Pharmacy on-site", "Mobility"],
    barrier: "Out-of-network benefit applies",
    note: "Strong pulmonary program; bariatric bed requires final equipment confirmation.",
  },
]

export const patientColors = ["#d7e6ff", "#e8ddff", "#ffe4d7", "#d5f3e6", "#fde2ef", "#fff1c9", "#e0f2fe", "#ede9fe"]
