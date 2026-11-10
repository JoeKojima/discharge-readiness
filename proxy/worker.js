// ClearPath AI proxy: a Cloudflare Worker that holds the Anthropic API key so
// the GitHub Pages site can call Claude without exposing the key.
//
// Secrets / vars (see README.md):
//   ANTHROPIC_API_KEY  (secret)  your Anthropic API key
//   ACCESS_CODE        (secret)  optional shared code the site must send
//   ALLOWED_ORIGINS    (var)     comma-separated origins allowed to call it

const ALLOWED_MODELS = new Set(["claude-opus-5-5"])
const MAX_TOKENS = 16000

function error(status, type, message, cors) {
  return new Response(JSON.stringify({ type: "error", error: { type, message } }), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  })
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || ""
    const allowed = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const originOk = allowed.includes(origin)
    const cors = {
      "Access-Control-Allow-Origin": originOk ? origin : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "content-type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    }

    if (request.method === "OPTIONS") return new Response(null, { status: originOk ? 204 : 403, headers: cors })
    if (!originOk) return error(403, "permission_error", "Origin not allowed", cors)

    const url = new URL(request.url)
    if (request.method !== "POST" || url.pathname !== "/v1/messages")
      return error(404, "not_found_error", "Only POST /v1/messages is proxied", cors)

    if (env.ACCESS_CODE && request.headers.get("x-clearpath-code") !== env.ACCESS_CODE)
      return error(401, "authentication_error", "Wrong or missing access code", cors)

    let body
    try {
      body = await request.json()
    } catch {
      return error(400, "invalid_request_error", "Body must be JSON", cors)
    }
    if (!ALLOWED_MODELS.has(body.model)) return error(400, "invalid_request_error", "Model not allowed by proxy", cors)
    if (typeof body.max_tokens !== "number" || body.max_tokens > MAX_TOKENS) body.max_tokens = MAX_TOKENS

    const headers = {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": request.headers.get("anthropic-version") || "2023-06-01",
    }
    const beta = request.headers.get("anthropic-beta")
    if (beta) headers["anthropic-beta"] = beta

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, "content-type": upstream.headers.get("content-type") || "application/json" },
    })
  },
}
