import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { autoConnect, completeSignIn } from "./epic"
import "./index.css"

// If Epic just redirected back from sign-in, finish it before the hash router reads the URL.
// With no Epic session yet, go straight to Epic's sign-in (once per tab).
completeSignIn()
  .catch(() => undefined)
  .then(() => autoConnect())
  .then((leaving) => {
    if (leaving) {
      document.getElementById("root")!.textContent = "Connecting to Epic…"
      return
    }
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
