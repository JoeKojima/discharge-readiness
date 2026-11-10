import { useCallback, useEffect, useRef, useState } from "react"

// Minimal typings for the Web Speech API (not in TypeScript's DOM lib).
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } }
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> }
type RecognitionError = { error: string }
type Recognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  processLocally?: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: RecognitionError) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechOptions = { langs: string[]; processLocally?: boolean }
type RecognitionCtor = {
  new (): Recognition
  // On-device recognition (newer browsers): check for and install a local language pack.
  available?: (options: SpeechOptions) => Promise<"unavailable" | "downloadable" | "downloading" | "available">
  install?: (options: SpeechOptions) => Promise<boolean>
}

const LANG = "en-US"
const ON_DEVICE: SpeechOptions = { langs: [LANG], processLocally: true }

/** Where transcription runs: on this device, or the browser's cloud speech service. */
export type SpeechEngine = "device" | "cloud"

// Use on-device recognition when the browser offers it. Must run inside the
// click handler: installing a language pack needs the user's click.
async function prepareOnDevice(Ctor: RecognitionCtor, onDownload: () => void): Promise<boolean> {
  if (!Ctor.available || !Ctor.install) return false
  try {
    const status = await Ctor.available(ON_DEVICE)
    if (status === "unavailable") return false
    if (status === "available") return true
    if (status === "downloading") onDownload()
    // "downloadable" is also reported until this site asks once, even when it's installed.
    const slow = window.setTimeout(onDownload, 800)
    try {
      return await Ctor.install(ON_DEVICE)
    } finally {
      window.clearTimeout(slow)
    }
  } catch {
    return false
  }
}

function getRecognition(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const speechSupported = () => typeof window !== "undefined" && !!getRecognition()

const errorText: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow the mic for this site in your browser, then try again.",
  "service-not-allowed": "Speech recognition isn't allowed in this browser. Try Chrome, Edge or Safari.",
  "audio-capture": "No microphone was found.",
  network:
    "This browser couldn't reach its speech-to-text service, so live transcription is unavailable here. This happens in Brave, Arc, Opera, Vivaldi and in-app browsers, or when a VPN or firewall blocks it. Use Google Chrome, Edge or Safari, or type the notes instead.",
  "language-not-supported": "Speech recognition for English isn't available in this browser.",
}

// Errors that mean on-device recognition can't be used, so fall back to the cloud service.
const deviceFallback = new Set(["network", "service-not-allowed", "language-not-supported"])

/**
 * Ambient capture: keeps the browser's speech recognizer running for the whole
 * round (it stops itself after silences, so we restart it) and reports each
 * finished phrase through `onFinal`. Prefers on-device recognition, so audio
 * stays on this computer, and falls back to the browser's cloud service.
 */
export function useAmbientCapture(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const recRef = useRef<Recognition | null>(null)
  const wantRef = useRef(false)
  const onFinalRef = useRef(onFinal)
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null)
  const engineRef = useRef<SpeechEngine>("cloud")
  const sessionRef = useRef(0)
  const [engine, setEngine] = useState<SpeechEngine | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [preparingLabel, setPreparingLabel] = useState("Preparing on-device speech…")
  onFinalRef.current = onFinal

  useEffect(() => {
    if (!listening) return
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [listening])

  const stop = useCallback(() => {
    wantRef.current = false
    sessionRef.current++
    setPreparing(false)
    setPreparingLabel("Preparing on-device speech…")
    recRef.current?.stop()
    recRef.current = null
    setListening(false)
    setInterim("")
    wakeRef.current?.release().catch(() => {})
    wakeRef.current = null
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognition()
    if (!Ctor) {
      setError("Live transcription isn't supported in this browser. Use Chrome, Edge or Safari, or type the notes instead.")
      return
    }
    setError(null)
    wantRef.current = true
    const session = ++sessionRef.current

    const launch = () => {
      const rec = new Ctor()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = LANG
      if (engineRef.current === "device") rec.processLocally = true
      rec.onresult = (e) => {
        let pending = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i]
          const text = r[0].transcript.trim()
          if (!text) continue
          if (r.isFinal) onFinalRef.current(text)
          else pending += `${text} `
        }
        setInterim(pending.trim())
      }
      rec.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return
        if (engineRef.current === "device" && deviceFallback.has(e.error)) {
          // On-device didn't work; onend restarts with the cloud service.
          engineRef.current = "cloud"
          setEngine("cloud")
          return
        }
        setError(errorText[e.error] ?? `Speech recognition error: ${e.error}`)
        if (e.error in errorText) wantRef.current = false
      }
      rec.onend = () => {
        setInterim("")
        if (wantRef.current && sessionRef.current === session) {
          try {
            launch()
          } catch {
            stop()
          }
        } else if (sessionRef.current === session) {
          setListening(false)
        }
      }
      recRef.current = rec
      rec.start()
    }

    const begin = (onDevice: boolean) => {
      setPreparing(false)
      if (!wantRef.current || sessionRef.current !== session) return
      engineRef.current = onDevice ? "device" : "cloud"
      setEngine(engineRef.current)
      try {
        launch()
        setListening(true)
        const nav = navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }
        nav.wakeLock?.request("screen").then((lock) => (wakeRef.current = lock)).catch(() => {})
      } catch {
        setError("Couldn't start the microphone.")
        wantRef.current = false
      }
    }

    if (!Ctor.available || !Ctor.install) {
      begin(false)
      return
    }
    setPreparing(true)
    prepareOnDevice(Ctor, () => setPreparingLabel("Downloading on-device speech model (one time)…")).then(begin)
  }, [stop])

  // Stop listening when the component unmounts (e.g. switching patients).
  useEffect(
    () => () => {
      wantRef.current = false
      sessionRef.current++
      recRef.current?.abort()
      wakeRef.current?.release().catch(() => {})
    },
    [],
  )

  const resetTimer = useCallback(() => setElapsed(0), [])

  return {
    listening,
    preparing,
    preparingLabel,
    engine,
    interim,
    error,
    elapsed,
    start,
    stop,
    resetTimer,
    supported: speechSupported(),
  }
}

export function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}
