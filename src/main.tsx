import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { completeSignIn } from "./epic"
import "./index.css"

// If Epic just redirected back from sign-in, finish it before the hash router reads the URL.
completeSignIn().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
