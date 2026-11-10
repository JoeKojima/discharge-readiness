import { useEffect, useRef, useState } from "react"
import { staff } from "../data"
import { navigate, useStore } from "../store"
import { Avatar, Icon, PageHeader, card } from "../ui"

const replies = [
  "Got it, thanks. I'll take care of it.",
  "Thanks. I'll update you within the hour.",
  "Sounds good. I'll document it in the chart.",
  "Will do. I'll let the family know as well.",
]

export function Messages({ threadId }: { threadId?: string }) {
  const { state, dispatch } = useStore()
  const threads = state.threads
  const active = threadId ? threads.find((t) => t.id === threadId) : undefined
  const [draft, setDraft] = useState("")
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active?.unread) dispatch({ type: "readThread", threadId: active.id })
  }, [active?.id, active?.unread, dispatch])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [active?.messages.length, typing])

  const person = active && staff.find((s) => s.id === active.staffId)
  const patient = active?.patientId ? state.patients.find((p) => p.id === active.patientId) : undefined

  const send = () => {
    const text = draft.trim()
    if (!text || !active) return
    dispatch({ type: "sendMessage", threadId: active.id, text, from: "me" })
    setDraft("")
    setTyping(true)
    const id = active.id
    window.setTimeout(() => {
      dispatch({ type: "sendMessage", threadId: id, text: replies[Math.floor(Math.random() * replies.length)], from: "them" })
      dispatch({ type: "readThread", threadId: id })
      setTyping(false)
    }, 1600)
  }

  return (
    <>
      <PageHeader crumb="Messages" title="Care team messages" subtitle="Secure messages with nursing, case management, therapy, and pharmacy." />
      <div className={`${card} grid min-h-[560px] overflow-hidden lg:grid-cols-[320px_1fr]`}>
        <ul className={`divide-y divide-[#edf1ef] border-[#e7ecea] lg:border-r ${threadId ? "hidden lg:block" : ""}`}>
          {threads.map((t) => {
            const s = staff.find((x) => x.id === t.staffId)!
            const last = t.messages[t.messages.length - 1]
            return (
              <li key={t.id}>
                <button
                  onClick={() => navigate(`/messages/${t.id}`)}
                  className={`flex w-full gap-3 px-5 py-4 text-left transition ${t.id === active?.id ? "bg-[#eef6f3]" : "hover:bg-[#f6faf8]"}`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold" style={{ background: s.color, color: s.text }}>
                    {s.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-[12px] text-[#29463f] ${t.unread ? "font-bold" : "font-semibold"}`}>{s.name}</p>
                      <span className="ml-auto shrink-0 text-[9px] text-[#8a9894]">{last?.time ?? "New"}</span>
                    </div>
                    <p className="truncate text-[10px] font-medium text-[#5e7570]">{t.subject}</p>
                    <p className={`truncate text-[10px] ${t.unread ? "text-[#29463f]" : "text-[#8a9894]"}`}>
                      {last ? `${last.from === "me" ? "You: " : ""}${last.text}` : "No messages yet"}
                    </p>
                  </div>
                  {t.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#d75544]" aria-label="Unread" />}
                </button>
              </li>
            )
          })}
        </ul>

        {active && person ? (
          <div className="flex min-h-[560px] flex-col">
            <div className="flex items-center gap-3 border-b border-[#e7ecea] px-5 py-4">
              <a href="#/messages" aria-label="Back to inbox" className="rounded-lg p-1.5 text-[#60716d] hover:bg-[#eef3f1] lg:hidden">
                <Icon name="chevron" size={16} className="rotate-180" />
              </a>
              <div className="grid h-9 w-9 place-items-center rounded-lg text-[10px] font-bold" style={{ background: person.color, color: person.text }}>
                {person.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[#29463f]">{person.name}</p>
                <p className="text-[10px] text-[#82918d]">
                  {person.role} · Pager {person.pager}
                </p>
              </div>
              {patient && (
                <a
                  href={`#/patients/${patient.id}`}
                  className="flex items-center gap-2 rounded-lg border border-[#dce5e2] py-1 pl-1 pr-2.5 text-[10px] font-semibold text-[#2f5a4e] hover:bg-[#f0f5f3]"
                >
                  <Avatar initials={patient.initials} color={patient.color} size={22} />
                  <span className="hidden sm:inline">{patient.name}</span>
                </a>
              )}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#fafcfb] px-5 py-5">
              {active.messages.length === 0 && (
                <p className="py-10 text-center text-[11px] text-[#8a9894]">Start the conversation with {person.name}.</p>
              )}
              {active.messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed ${
                      m.from === "me" ? "rounded-br-md bg-[#156d53] text-white" : "rounded-bl-md border border-[#e2e9e6] bg-white text-[#3d554f]"
                    }`}
                  >
                    {m.text}
                    <p className={`mt-1 text-[9px] ${m.from === "me" ? "text-white/70" : "text-[#8a9894]"}`}>{m.time}</p>
                  </div>
                </div>
              ))}
              {typing && (
                <p className="text-[10px] italic text-[#8a9894]">{person.name.split(" ")[0]} is typing…</p>
              )}
              <div ref={endRef} />
            </div>
            <form
              className="flex gap-2 border-t border-[#e7ecea] p-4"
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${person.name}`}
                aria-label="Message"
                className="h-10 flex-1 rounded-xl border border-[#d9e3e0] bg-white px-3 text-[12px] outline-none focus:border-[#74a99a] focus:ring-2 focus:ring-[#dceee8]"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="flex items-center gap-2 rounded-xl bg-[#156d53] px-4 text-[12px] font-semibold text-white hover:bg-[#105b45] disabled:opacity-50"
              >
                <Icon name="send" size={14} />
                Send
              </button>
            </form>
          </div>
        ) : (
          <div className={`place-items-center p-10 text-center text-[12px] text-[#8a9894] ${threadId ? "grid" : "hidden lg:grid"}`}>
            {threadId ? "That conversation no longer exists." : "Select a conversation to read it."}
          </div>
        )}
      </div>
    </>
  )
}
