import { useEffect, useState } from "react"
import { openTasks } from "./logic"
import { navigate, StoreProvider, usePatient, useRoute, useStore } from "./store"
import { GeneratorModal } from "./components/Modals"
import { Overview } from "./pages/Overview"
import { Patients } from "./pages/Patients"
import { Tasks } from "./pages/Tasks"
import { Rounds } from "./pages/Rounds"
import { Messages } from "./pages/Messages"
import { Settings } from "./pages/Settings"
import { Icon, type IconName } from "./ui"

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
}

function Shell() {
  const { state, dispatch, toast } = useStore()
  const path = useRoute()
  const [mobileNav, setMobileNav] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [, section = "", param] = path.split("/")
  const routeId = param ? decodeURIComponent(param) : undefined

  // Opening a patient's page (or their rounds) makes them the selected patient.
  useEffect(() => {
    if ((section === "patients" || section === "rounds") && routeId && state.patients.some((p) => p.id === routeId)) {
      if (state.selectedId !== routeId) dispatch({ type: "select", id: routeId })
    }
  }, [section, routeId, state.patients, state.selectedId, dispatch])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileNav(false)
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const patient = usePatient(
    (section === "patients" || section === "rounds") && routeId ? routeId : undefined,
  )

  if (!state.signedIn) return <SignedOut onSignIn={() => dispatch({ type: "signIn" })} />

  const unread = state.threads.filter((t) => t.unread).length
  const openCount = state.patients.reduce((n, p) => n + openTasks(p).length, 0)
  // Overview is the unit-wide patient dashboard; My patients is each patient's discharge command centre.
  const active =
    section === ""
      ? "Overview"
      : section === "patients"
        ? "My patients"
        : section === "tasks"
          ? "Tasks"
          : section === "rounds"
            ? "Rounds"
            : section === "messages"
              ? "Messages"
              : section === "settings"
                ? "Settings"
                : ""

  const navItems: { label: string; icon: IconName; href: string; count?: number }[] = [
    { label: "Overview", icon: "home", href: "#/" },
    { label: "My patients", icon: "patients", href: `#/patients/${state.selectedId}`, count: state.patients.length },
    { label: "Tasks", icon: "check", href: "#/tasks", count: openCount },
    { label: "Rounds", icon: "stethoscope", href: `#/rounds/${state.selectedId}` },
    { label: "Messages", icon: "message", href: "#/messages", count: unread || undefined },
  ]

  const knownSection = ["", "patients", "tasks", "rounds", "messages", "settings"].includes(section)
  const missingPatient = (section === "patients" || section === "rounds") && routeId && !state.patients.some((p) => p.id === routeId)

  let page
  if (!knownSection || missingPatient) page = <NotFound />
  else if (section === "") page = <Patients />
  else if (!patient && ["patients", "rounds"].includes(section)) page = <EmptyList />
  else if (section === "patients") page = <Overview key={patient!.id} patient={patient!} />
  else if (section === "tasks") page = <Tasks />
  else if (section === "rounds") page = <Rounds patient={patient!} />
  else if (section === "messages") page = <Messages key={routeId ?? "inbox"} threadId={routeId} />
  else page = <Settings />

  const sideBtn = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition"

  return (
    <div className="min-h-screen bg-[#f3f6f5] text-[#1d2f2b]">
      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-[#112d27]/35 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileNav(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 w-[238px] flex-col border-r border-[#dfe7e4] bg-[#f9fbfa] lg:z-30 lg:flex ${
          mobileNav ? "z-50 flex shadow-2xl" : "hidden"
        }`}
      >
        <a href="#/" onClick={() => setMobileNav(false)} className="flex h-[78px] items-center gap-3 border-b border-[#e7ecea] px-6">
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#126b51] text-white">
            <Icon name="activity" size={21} />
          </div>
          <div>
            <div className="text-[17px] font-semibold tracking-[-0.03em] text-[#163d34]">ClearPath</div>
            <div className="text-[10px] font-medium uppercase tracking-[.16em] text-[#79908a]">Clinical workflow</div>
          </div>
        </a>
        <div className="px-4 pt-6">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.13em] text-[#82918d]">Workspace</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileNav(false)}
                aria-current={active === item.label ? "page" : undefined}
                className={`${sideBtn} ${
                  active === item.label ? "bg-[#e4f1ed] text-[#126b51]" : "text-[#60716d] hover:bg-[#eef3f1] hover:text-[#284b42]"
                }`}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] ${active === item.label ? "bg-white/70" : "bg-[#e8eeec]"}`}>
                    {item.count}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-auto px-4 pb-5">
          <a
            href={`#/rounds/${state.selectedId}`}
            onClick={() => setMobileNav(false)}
            className="mb-4 block rounded-2xl border border-[#dce8e3] bg-white p-4 hover:border-[#b9d6cc]"
          >
            <div className="mb-2 flex items-center gap-2 text-[#126b51]">
              <Icon name="sparkles" size={16} />
              <span className="text-[11px] font-semibold uppercase tracking-wide">AI rounds assistant</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#687b76]">
              {state.settings.ambientSync
                ? `${state.patients.filter((p) => p.roundedAt).length} of ${state.patients.length} patients synced from rounds.`
                : "Ambient sync is paused."}
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#e5ece9]">
              <div
                className="h-full rounded-full bg-[#35a881] transition-all"
                style={{
                  width: `${state.patients.length ? (state.patients.filter((p) => p.roundedAt).length / state.patients.length) * 100 : 0}%`,
                }}
              />
            </div>
          </a>
          <a
            href="#/settings"
            onClick={() => setMobileNav(false)}
            className={`${sideBtn} ${active === "Settings" ? "bg-[#e4f1ed] text-[#126b51]" : "text-[#60716d] hover:bg-[#eef3f1]"}`}
          >
            <Icon name="settings" size={18} />
            Settings
          </a>
          <button onClick={() => dispatch({ type: "signOut" })} className={`${sideBtn} text-[#60716d] hover:bg-[#eef3f1]`}>
            <Icon name="logout" size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-[238px]">
        <header className="sticky top-0 z-20 flex h-[78px] items-center border-b border-[#e0e7e4] bg-[#f9fbfa]/95 px-4 backdrop-blur md:px-7 lg:px-9">
          <button onClick={() => setMobileNav(true)} aria-label="Open menu" className="mr-3 rounded-lg p-2 text-slate-600 lg:hidden">
            <Icon name="menu" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#81918c]">
              {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="mt-0.5 truncate text-[18px] font-semibold tracking-[-.025em] text-[#173d34]">{greeting()}, Dr. Chen</h1>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            {patient && (
              <button
                onClick={() => setGenerating(true)}
                className="hidden items-center gap-2 rounded-xl bg-[#156d53] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(21,109,83,.18)] transition hover:bg-[#105b45] sm:flex"
              >
                <Icon name="sparkles" size={16} />
                Generate checklist
              </button>
            )}
            <a
              href="#/messages"
              aria-label={`Messages${unread ? ` (${unread} unread)` : ""}`}
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#dce5e2] bg-white text-[#556a64] hover:bg-[#f2f6f4]"
            >
              <Icon name="message" size={17} />
              {unread > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#d75544]" />}
            </a>
            <a
              href="#/settings"
              aria-label="Profile and settings"
              className="ml-1 grid h-10 w-10 place-items-center rounded-xl bg-[#d9e7ff] text-[12px] font-semibold text-[#31527c] hover:ring-2 hover:ring-[#b9cff5]"
            >
              LC
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-7 lg:px-9 lg:py-8">{page}</main>
      </div>

      {generating && patient && <GeneratorModal patient={patient} onClose={() => setGenerating(false)} />}

      {toast && (
        <div
          role="status"
          className="toast-in fixed bottom-6 left-1/2 z-[60] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2.5 rounded-xl bg-[#173d34] px-4 py-3 text-[12px] font-medium text-white shadow-xl"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#35a881]">
            <Icon name="check" size={12} />
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}

function NotFound() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <p className="text-[40px] font-semibold text-[#173b33]">404</p>
      <p className="mt-1 text-[13px] text-[#70807c]">That page or patient doesn't exist.</p>
      <button onClick={() => navigate("/")} className="mt-5 rounded-xl bg-[#156d53] px-4 py-2.5 text-[12px] font-semibold text-white">
        Go to overview
      </button>
    </div>
  )
}

function EmptyList() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <p className="text-[18px] font-semibold text-[#173b33]">No patients on your list</p>
      <p className="mt-1 text-[13px] text-[#70807c]">Add a patient from the patient dashboard to get started.</p>
      <button onClick={() => navigate("/")} className="mt-5 rounded-xl bg-[#156d53] px-4 py-2.5 text-[12px] font-semibold text-white">
        Open patient dashboard
      </button>
    </div>
  )
}

function SignedOut({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f3f6f5] px-4">
      <div className="w-full max-w-[380px] rounded-[24px] border border-[#dbe4e1] bg-white p-8 text-center shadow-[0_8px_30px_rgba(30,65,55,.06)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#126b51] text-white">
          <Icon name="activity" size={26} />
        </div>
        <h1 className="mt-4 text-[20px] font-semibold tracking-tight text-[#173d34]">You're signed out</h1>
        <p className="mt-1 text-[12px] text-[#7b8b87]">ClearPath · Clinical workflow</p>
        <button
          onClick={() => {
            onSignIn()
            navigate("/")
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#156d53] px-4 py-3 text-[13px] font-semibold text-white hover:bg-[#105b45]"
        >
          <Icon name="login" size={16} />
          Sign in as Dr. Chen
        </button>
        <p className="mt-4 text-[10px] text-[#8a9894]">Demo app · no real patient data</p>
      </div>
    </div>
  )
}
