# ClearPath AI proxy

GitHub Pages only serves static files, so the site can't hold an Anthropic API key safely. This Cloudflare Worker
holds the key and forwards the site's summarize requests to Claude. Only the origins in `ALLOWED_ORIGINS` can call
it from a browser, only `POST /v1/messages` with the `claude-opus-5-5` model is forwarded, and if `ACCESS_CODE` is
set every request must carry it.

## Deploy (about 5 minutes, free Cloudflare plan)

1. Create a free account at <https://dash.cloudflare.com/sign-up>.
2. From this folder, log in and deploy:

   ```bash
   cd proxy
   npx wrangler login
   npx wrangler deploy
   ```

   The output prints the worker URL, such as `https://clearpath-proxy.<your-subdomain>.workers.dev`.
3. Add the secrets. Each command prompts for the value:

   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put ACCESS_CODE
   ```

   Pick any passphrase for `ACCESS_CODE` and share it only with people who should use the summarizer.
4. In the site, open **Settings → AI rounds summarizer**, choose **Team proxy**, paste the worker URL and the access
   code, and click **Test connection**.

If you host the site somewhere other than `https://joekojima.github.io`, add that origin to `ALLOWED_ORIGINS` in
`wrangler.toml` and run `npx wrangler deploy` again.

## Cost and safety

Every summary is a Claude API call billed to the key's account. Set a monthly spend limit in the Anthropic Console.
This is a demo: don't send real patient information through it.
