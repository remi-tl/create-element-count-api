import { describe, expect, it, vi } from "vitest";

import { launchBrowserWithRetries } from "./browser-launch";

describe("launchBrowserWithRetries", () => {
  it("retries timeout failures and eventually succeeds", async () => {
    vi.useFakeTimers();
    try {
      const timeoutError = Object.assign(new Error("Timed out"), {
        name: "TimeoutError"
      });
      const createBrowser = vi.fn()
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({
          close: vi.fn()
        });

      const browserPromise = launchBrowserWithRetries(createBrowser);
      await vi.runAllTimersAsync();
      const browser = await browserPromise;

      expect(browser).toEqual({
        close: expect.any(Function)
      });
      expect(createBrowser).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not retry non-timeout failures", async () => {
    const error = new Error("Browser launch failed");
    const createBrowser = vi.fn().mockRejectedValue(error);

    await expect(launchBrowserWithRetries(createBrowser)).rejects.toBe(error);
    expect(createBrowser).toHaveBeenCalledTimes(1);
  });
});
