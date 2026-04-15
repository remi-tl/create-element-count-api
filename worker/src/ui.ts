export function renderHomePage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CreateElement Count</title>
    <style>
      :root {
        color-scheme: light;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top, rgba(55, 95, 200, 0.18), transparent 34%),
          linear-gradient(180deg, #eef4ff 0%, #f8fbff 52%, #ffffff 100%);
        color: #142033;
      }

      main {
        width: min(720px, calc(100vw - 32px));
        margin: 48px auto;
      }

      .card {
        padding: 24px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(120, 146, 194, 0.25);
        box-shadow: 0 24px 80px rgba(33, 56, 100, 0.12);
        backdrop-filter: blur(16px);
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(28px, 4vw, 40px);
        line-height: 1.05;
      }

      p {
        margin: 0 0 20px;
        color: #455169;
        line-height: 1.5;
      }

      form {
        display: grid;
        gap: 14px;
      }

      label {
        display: grid;
        gap: 6px;
        font-size: 14px;
        font-weight: 600;
      }

      input {
        width: 100%;
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid #c9d4ea;
        background: #fbfdff;
        color: #142033;
        font: inherit;
      }

      input:focus {
        outline: 2px solid rgba(35, 92, 255, 0.25);
        border-color: #235cff;
      }

      .row {
        display: grid;
        grid-template-columns: 1fr 180px;
        gap: 14px;
      }

      button {
        appearance: none;
        border: 0;
        border-radius: 12px;
        background: linear-gradient(135deg, #17315b 0%, #235cff 100%);
        color: white;
        padding: 14px 18px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      button:disabled {
        cursor: progress;
        opacity: 0.7;
      }

      .status {
        margin-top: 18px;
        min-height: 24px;
        color: #4f5e79;
        font-size: 14px;
      }

      .result {
        margin-top: 18px;
        padding: 16px;
        border-radius: 14px;
        background: #0d1730;
        color: #eef3ff;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .count {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 16px;
        padding: 10px 14px;
        border-radius: 999px;
        background: #edf3ff;
        color: #17315b;
        font-weight: 700;
      }

      .count strong {
        font-size: 18px;
      }

      @media (max-width: 640px) {
        main {
          margin: 24px auto;
        }

        .card {
          padding: 18px;
        }

        .row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="card">
        <h1>CreateElement Count</h1>
        <p>Enter a domain or full URL and this Worker will load it with Cloudflare Browser Rendering, count <code>document.createElement</code> calls until <code>load</code>, and show the result. No auth or token is required.</p>

        <form id="count-form">
          <label>
            Domain or URL
            <input id="url" name="url" type="text" placeholder="skims.com or https://skims.com" autocomplete="url" required />
          </label>

          <div class="row">
            <label>
              Timeout (ms)
              <input id="timeoutMs" name="timeoutMs" type="number" min="5000" max="60000" step="1000" value="60000" required />
            </label>
            <div></div>
          </div>

          <button id="submit" type="submit">Run Count</button>
        </form>

        <div class="status" id="status"></div>
        <div class="count" id="count-pill" hidden><span id="count-label">Count</span>: <strong id="count-value">-</strong></div>
        <pre class="result" id="result" hidden></pre>
      </section>
    </main>

    <script>
      const form = document.getElementById("count-form");
      const submit = document.getElementById("submit");
      const status = document.getElementById("status");
      const result = document.getElementById("result");
      const countPill = document.getElementById("count-pill");
      const countLabel = document.getElementById("count-label");
      const countValue = document.getElementById("count-value");
      const timeoutInput = document.getElementById("timeoutMs");

      timeoutInput.value = localStorage.getItem("create-element-timeout") || timeoutInput.value;

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        result.hidden = true;
        countPill.hidden = true;

        const formData = new FormData(form);
        const timeoutMs = Number(formData.get("timeoutMs"));
        const rawUrl = String(formData.get("url") || "").trim();

        if (!rawUrl) {
          status.textContent = "Enter a domain or URL first.";
          return;
        }

        const normalizedUrl = rawUrl.match(/^https?:\\/\\//i) ? rawUrl : "https://" + rawUrl;

        localStorage.setItem("create-element-timeout", String(timeoutMs));

        submit.disabled = true;
        status.textContent = "Running count...";

        try {
          const response = await fetch("/api/create-element-count", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              url: normalizedUrl,
              timeoutMs
            })
          });

          const payload = await response.json();
          result.hidden = false;
          result.textContent = JSON.stringify(payload, null, 2);

          if (response.ok && payload.ok) {
            countPill.hidden = false;
            countLabel.textContent = payload.loadFired ? "Count" : "Count so far";
            countValue.textContent = String(payload.count);
            status.textContent = payload.loadFired
              ? "Count complete."
              : "Load did not finish before timeout. Showing the count so far.";
          } else {
            status.textContent = payload && payload.error && payload.error.message
              ? payload.error.message
              : "Request failed.";
          }
        } catch (error) {
          result.hidden = false;
          result.textContent = JSON.stringify({
            ok: false,
            error: {
              code: "REQUEST_FAILED",
              message: error instanceof Error ? error.message : "Request failed."
            }
          }, null, 2);
          status.textContent = "Request failed.";
        } finally {
          submit.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
}
