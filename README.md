# CreateElement Count API

This repo contains two related tools for measuring `document.createElement` activity:

- a Chrome extension in the repository root for quick local inspection in the browser
- a Cloudflare Worker in `worker/` that uses Browser Rendering and Playwright to count calls remotely

The live Worker is currently deployed at:

- `https://create-element-count-api.remi-touchless.workers.dev/`

## Project layout

- `manifest.json`, `popup.html`, `popup.js`, `content.js`, `page-hook.js`, `background.js`, `sidepanel.html`
  - unpacked browser extension for local debugging and page instrumentation
- `worker/`
  - Cloudflare Worker app with the API, browser UI, tests, and Wrangler config

## API

Endpoint:

- `POST /api/create-element-count`

Example:

```bash
curl -X POST 'https://create-element-count-api.remi-touchless.workers.dev/api/create-element-count' \
  -H 'Content-Type: application/json' \
  --data '{"url":"https://example.com","timeoutMs":60000}'
```

Example request body:

```json
{
  "url": "https://example.com",
  "timeoutMs": 60000
}
```

## Local development

### Extension

1. Open `chrome://extensions` or `edge://extensions`
2. Enable Developer Mode
3. Choose `Load unpacked`
4. Select the repository root

### Worker

1. `cd worker`
2. `npm install`
3. `npm test`
4. `npm run typecheck`
5. `npm run dev`

## Notes

- The Worker counts `document.createElement` calls observed in the rendered page up to `load`.
- If a page never reaches `load` before the timeout, the Worker returns the count gathered so far.
- Browser Rendering availability can still be the limiting factor for some requests, even when the Worker itself is healthy.
