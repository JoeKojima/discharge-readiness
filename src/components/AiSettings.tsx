import { useState } from "react"
import { MODEL, aiReady, testConnection, type AiMode } from "../ai"
import { useStore } from "../store"
import { Icon, card, inputCls, labelCls, secondaryBtn } from "../ui"

const modes: { id: AiMode; label: string; detail: string }[] = [
  { id: "rules", label: "Built-in rules", detail: "Keyword matching in the browser. No AI, no setup." },
  { id: "key", label: "My Anthropic API key", detail: "Calls Claude directly from this browser. Best for trying it yourself." },
  { id: "proxy", label: "Team proxy", detail: "Calls Claude through your Cloudflare Worker, which holds the key. Best for sharing the site." },
]

export function AiSettingsCard() {
  const { state, dispatch } = useStore()
  const ai = state.ai
  const [show, setShow] = useState(false)
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null)
  const [testing, setTesting] = useState(false)

  const set = (patch: Partial<typeof ai>) => {
    setTest(null)
    dispatch({ type: "aiConfig", ai: patch })
  }

  const runTest = async () => {
    setTesting(true)
    setTest(null)
    try {
      const model = await testConnection(ai)
      setTest({ ok: true, text: `Connected. ${model} is ready to summarize rounds.` })
    } catch (err) {
      setTest({ ok: false, text: err instanceof Error ? err.message : "Connection failed." })
    } finally {
      setTesting(false)
    }
  }

  return (
    <section className={`${card} p-5 md:p-6 lg:col-span-2`} aria-labelledby="ai-settings">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e4f1ed] text-[#156d53]">
          <Icon name="sparkles" size={18} />
        </div>
        <div>
          <h3 id="ai-settings" className="text-[13px] font-semibold text-[#29463f]">AI rounds summarizer</h3>
          <p className="text-[11px] text-[#7b8b87]">
            Turns the ambient rounds transcript into a clinical summary and checklist updates using Claude ({MODEL}).
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-3" role="radiogroup" aria-label="Summarizer">
        {modes.map((m) => (
          <label
            key={m.id}
            className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition ${
              ai.mode === m.id ? "border-[#74a99a] bg-[#f1f8f5] ring-2 ring-[#dceee8]" : "border-[#dbe4e1] hover:bg-[#f8fbfa]"
            }`}
          >
            <input
              type="radio"
              name="ai-mode"
              checked={ai.mode === m.id}
              onChange={() => set({ mode: m.id })}
              className="mt-0.5 accent-[#156d53]"
            />
            <span>
              <span className="block text-[12px] font-semibold text-[#29463f]">{m.label}</span>
              <span className="block text-[10px] leading-relaxed text-[#7b8b87]">{m.detail}</span>
            </span>
          </label>
        ))}
      </div>

      {ai.mode === "key" && (
        <div className="mt-5 max-w-xl">
          <label className={labelCls} htmlFor="ai-key">Anthropic API key</label>
          <div className="flex gap-2">
            <input
              id="ai-key"
              type={show ? "text" : "password"}
              value={ai.apiKey}
              onChange={(e) => set({ apiKey: e.target.value })}
              placeholder="sk-ant-…"
              autoComplete="off"
              spellCheck={false}
              className={inputCls}
            />
            <button type="button" onClick={() => setShow((s) => !s)} className={`${secondaryBtn} shrink-0`}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#8a9894]">
            Saved only in this browser's storage and sent only to api.anthropic.com. Anyone using this browser profile can read
            it, so use a key with a spending limit and don't use this mode on a shared computer.
          </p>
        </div>
      )}

      {ai.mode === "proxy" && (
        <div className="mt-5 grid max-w-xl gap-4">
          <div>
            <label className={labelCls} htmlFor="ai-proxy">Proxy URL</label>
            <input
              id="ai-proxy"
              value={ai.proxyUrl}
              onChange={(e) => set({ proxyUrl: e.target.value })}
              placeholder="https://clearpath-proxy.your-name.workers.dev"
              spellCheck={false}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ai-code">Access code</label>
            <input
              id="ai-code"
              type="password"
              value={ai.accessCode}
              onChange={(e) => set({ accessCode: e.target.value })}
              placeholder="The ACCESS_CODE set on the worker"
              autoComplete="off"
              className={inputCls}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-[#8a9894]">
            Setup steps are in <code>proxy/README.md</code> in the repository.
          </p>
        </div>
      )}

      {ai.mode !== "rules" && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button onClick={runTest} disabled={!aiReady(ai) || testing} className={`${secondaryBtn} disabled:opacity-50`}>
            {testing ? "Testing…" : "Test connection"}
          </button>
          {test && (
            <p role="status" className={`text-[11px] font-medium ${test.ok ? "text-[#2f7a62]" : "text-[#a6432f]"}`}>
              {test.text}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
