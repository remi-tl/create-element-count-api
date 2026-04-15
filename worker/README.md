# CreateElement Count Worker

Cloudflare Worker API that uses Browser Rendering and Playwright to count `document.createElement` calls during page load.

## Setup

1. `cd /Users/remicrosetti/Documents/New project/worker`
2. `npm install`

## Run

- Local remote dev: `npm run dev`
- Tests: `npm test`
- Typecheck: `npm run typecheck`
- Deploy: `npm run deploy`

## Request

`POST /api/create-element-count`

Headers:

- `Content-Type: application/json`

Body:

```json
{
  "url": "https://example.com",
  "timeoutMs": 30000
}
```

No auth header or bearer token is required.

## Browser UI

Open the Worker root URL in a browser:

`https://create-element-count-api.remi-touchless.workers.dev/`

The page includes a quick form where you can enter a domain or URL and run the count without using `curl`.

If the page never reaches `load` before the timeout, the API now returns the count gathered so far with `"waitedUntil": "timeout"` and `"loadFired": false` instead of failing outright.
