import { useCallback, useEffect, useRef, useState } from "react"

// Minimal typings for the Web Speech API (not in TypeScript's DOM lib).
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } }
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> }
type RecognitionError = { error: string }
type Recognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: RecognitionError) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionCtor = new () => Recognition

function getRecognition(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const speechSupported = () => typeof window !== "undefined" && !!getRecognition()

const errorText: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow the mic for this site in your browser, then try again.",
  "service-not-allowed": "Speech recognition isn't allowed in this browser. Try Chrome, Edge or Safari.",
  "audio-capture": "No microphone was found.",
  network: "Speech recognition needs an internet connection.",
}

/**
 * Ambient capture: keeps the browser's speech recognizer running for the whole
 * round (it stops itself after silences, so we restart it) and reports each
 * finished phrase through `onFinal`.
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
  onFinalRef.current = onFinal

  useEffect(() => {
    if (!listening) return
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [listening])

  const stop = useCallback(() => {
    wantRef.current = false
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

    const launch = () => {
      const rec = new Ctor()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = "en-US"
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
        setError(errorText[e.error] ?? `Speech recognition error: ${e.error}`)
        if (e.error in errorText) wantRef.current = false
      }
      rec.onend = () => {
        setInterim("")
        if (wantRef.current) {
          try {
            launch()
          } catch {
            stop()
          }
        } else {
          setListening(false)
        }
      }
      recRef.current = rec
      rec.start()
    }

    try {
      launch()
      setListening(true)
      const nav = navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }
      nav.wakeLock?.request("screen").then((lock) => (wakeRef.current = lock)).catch(() => {})
    } catch {
      setError("Couldn't start the microphone.")
      wantRef.current = false
    }
  }, [stop])

  // Stop listening when the component unmounts (e.g. switching patients).
  useEffect(
    () => () => {
      wantRef.current = false
      recRef.current?.abort()
      wakeRef.current?.release().catch(() => {})
    },
    [],
  )

  const resetTimer = useCallback(() => setElapsed(0), [])

  return { listening, interim, error, elapsed, start, stop, resetTimer, supported: speechSupported() }
}

export function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}
