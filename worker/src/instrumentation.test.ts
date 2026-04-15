import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

import { CREATE_ELEMENT_TRACKER_INIT_SCRIPT } from "./instrumentation";

describe("CREATE_ELEMENT_TRACKER_INIT_SCRIPT", () => {
  it("counts createElement calls until the load event completes", async () => {
    const dom = new JSDOM(
      `<!doctype html>
      <html>
        <head>
          <script>
            document.createElement("div");
            document.addEventListener("DOMContentLoaded", () => {
              document.createElement("span");
            });
            window.addEventListener("load", () => {
              document.createElement("p");
            });
          </script>
        </head>
        <body></body>
      </html>`,
      {
        beforeParse(window: Window & typeof globalThis) {
          window.eval(CREATE_ELEMENT_TRACKER_INIT_SCRIPT);
        },
        runScripts: "dangerously",
        url: "https://example.com"
      }
    );

    await waitForLoad(dom.window);

    const snapshot = (
      dom.window as Window & {
        __createElementTracker: {
          snapshot: () => {
            count: number;
            loadFired: boolean;
          };
        };
      }
    ).__createElementTracker.snapshot();

    expect(snapshot.count).toBe(3);
    expect(snapshot.loadFired).toBe(true);
  });
});

function waitForLoad(window: Window): Promise<void> {
  if (window.document.readyState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.addEventListener(
      "load",
      () => {
        resolve();
      },
      { once: true }
    );
  });
}
