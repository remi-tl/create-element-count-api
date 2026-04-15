const BROWSER_LAUNCH_RETRY_DELAYS_MS = [1_500, 4_000] as const;

export async function launchBrowserWithRetries<T>(createBrowser: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= BROWSER_LAUNCH_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await createBrowser();
    } catch (error) {
      lastError = error;

      if (!isTimeoutError(error) || attempt === BROWSER_LAUNCH_RETRY_DELAYS_MS.length) {
        throw error;
      }

      await sleep(BROWSER_LAUNCH_RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}

function isTimeoutError(error: unknown): error is Error {
  return error instanceof Error && error.name === "TimeoutError";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
