import { AppError } from "./errors";
import { CREATE_ELEMENT_TRACKER_INIT_SCRIPT } from "./instrumentation";
import type { CountRequest, CountResponse, TrackerSnapshot } from "./types";

interface BrowserLike {
  close(): Promise<void>;
  newPage(): Promise<PageLike>;
}

interface ResponseLike {
  status(): number;
}

interface PageLike {
  addInitScript(script: { content: string }): Promise<void>;
  close(): Promise<void>;
  evaluate<T>(pageFunction: () => T): Promise<T>;
  goto(
    url: string,
    options: {
      timeout: number;
      waitUntil: "domcontentloaded";
    }
  ): Promise<ResponseLike | null>;
  setDefaultNavigationTimeout(timeout: number): void;
  setDefaultTimeout(timeout: number): void;
  title(): Promise<string>;
  url(): string;
  waitForFunction(
    pageFunction: () => boolean,
    options: {
      timeout: number;
    }
  ): Promise<unknown>;
}

export async function measureCreateElementCountWithBrowserFactory(
  createBrowser: () => Promise<BrowserLike>,
  request: CountRequest
): Promise<CountResponse> {
  const startedAt = Date.now();
  let currentStep = "launch-browser";
  let browser: BrowserLike | undefined;
  let page: PageLike | undefined;
  let response: ResponseLike | null = null;

  try {
    browser = await createBrowser();
    currentStep = "new-page";
    page = await browser.newPage();

    currentStep = "add-init-script";
    await page.addInitScript({
      content: CREATE_ELEMENT_TRACKER_INIT_SCRIPT
    });

    currentStep = "set-timeouts";
    page.setDefaultNavigationTimeout(request.timeoutMs);
    page.setDefaultTimeout(request.timeoutMs);

    currentStep = "goto-domcontentloaded";
    try {
      response = await page.goto(request.url, {
        timeout: request.timeoutMs,
        waitUntil: "domcontentloaded"
      });
    } catch (error) {
      if (!isTimeoutError(error)) {
        throw error;
      }
    }

    const remainingMs = Math.max(1, request.timeoutMs - (Date.now() - startedAt));
    let waitedUntil: CountResponse["waitedUntil"] = "timeout";

    currentStep = "wait-for-load";
    try {
      await page.waitForFunction(
        () => {
          const tracker = (
            globalThis as typeof globalThis & {
              __createElementTracker?: {
                snapshot?: () => TrackerSnapshot;
              };
            }
          ).__createElementTracker;

          return Boolean(tracker?.snapshot?.().loadFired);
        },
        {
          timeout: remainingMs
        }
      );
      waitedUntil = "load";
    } catch (error) {
      if (!isTimeoutError(error)) {
        throw error;
      }
    }

    currentStep = "read-snapshot";
    const snapshot = await readSnapshot(page);
    currentStep = "read-title";
    const title = await readTitle(page);
    currentStep = "read-final-url";
    const finalUrl = page.url();

    if (response === null && finalUrl === "about:blank" && title === "" && snapshot.count === 0) {
      throw new AppError(408, "NAVIGATION_TIMEOUT", "Timed out before the page could finish initial navigation.");
    }

    return {
      count: snapshot.count,
      durationMs: Date.now() - startedAt,
      finalUrl,
      httpStatus: response?.status() ?? null,
      loadFired: snapshot.loadFired,
      ok: true,
      readyState: snapshot.readyState,
      requestedUrl: request.url,
      timestamp: new Date().toISOString(),
      title,
      waitedUntil: snapshot.loadFired ? "load" : waitedUntil
    };
  } catch (error) {
    if (currentStep === "launch-browser" && isTimeoutError(error)) {
      throw new AppError(
        503,
        "BROWSER_LAUNCH_TIMEOUT",
        "Cloudflare Browser Rendering could not connect to a browser session within 30 seconds. Please retry in about a minute."
      );
    }

    console.error("measureCreateElementCount failed", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      step: currentStep,
      url: request.url
    });
    throw error;
  } finally {
    await closeQuietly(page);
    await closeQuietly(browser);
  }
}

async function readSnapshot(page: PageLike): Promise<TrackerSnapshot> {
  return page.evaluate<TrackerSnapshot>(() => {
    const tracker = (
      globalThis as typeof globalThis & {
        __createElementTracker?: {
          snapshot?: () => TrackerSnapshot;
        };
      }
    ).__createElementTracker;

    if (tracker && typeof tracker.snapshot === "function") {
      return tracker.snapshot();
    }

    return {
      count: 0,
      loadFired: document.readyState === "complete",
      readyState: document.readyState
    };
  });
}

async function readTitle(page: PageLike): Promise<string> {
  try {
    return await page.title();
  } catch (_error) {
    return "";
  }
}

function isTimeoutError(error: unknown): error is Error {
  return error instanceof Error && error.name === "TimeoutError";
}

async function closeQuietly(target: { close: () => Promise<void> } | undefined): Promise<void> {
  if (!target) {
    return;
  }

  try {
    await target.close();
  } catch (_error) {
    // Best-effort cleanup.
  }
}
