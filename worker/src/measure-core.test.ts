import { describe, expect, it, vi } from "vitest";

import { measureCreateElementCountWithBrowserFactory } from "./measure-core";

describe("measureCreateElementCountWithBrowserFactory", () => {
  it("returns a full load result when the page reaches load", async () => {
    const closeBrowser = vi.fn().mockResolvedValue(undefined);
    const closePage = vi.fn().mockResolvedValue(undefined);
    const goto = vi.fn().mockResolvedValue({
      status: () => 200
    });
    const waitForFunction = vi.fn().mockResolvedValue(undefined);
    const evaluate = vi.fn().mockResolvedValue({
      count: 1312,
      loadFired: true,
      readyState: "complete"
    });
    const title = vi.fn().mockResolvedValue("SKIMS");

    const result = await measureCreateElementCountWithBrowserFactory(
      async () => ({
        close: closeBrowser,
        newPage: async () => ({
          addInitScript: vi.fn().mockResolvedValue(undefined),
          close: closePage,
          evaluate,
          goto,
          setDefaultNavigationTimeout: vi.fn(),
          setDefaultTimeout: vi.fn(),
          title,
          url: () => "https://skims.com/",
          waitForFunction
        })
      }),
      {
        timeoutMs: 60_000,
        url: "https://skims.com"
      }
    );

    expect(goto).toHaveBeenCalledWith("https://skims.com", {
      timeout: 60_000,
      waitUntil: "domcontentloaded"
    });
    expect(result.count).toBe(1312);
    expect(result.loadFired).toBe(true);
    expect(result.waitedUntil).toBe("load");
    expect(result.httpStatus).toBe(200);
    expect(result.readyState).toBe("complete");
    expect(closePage).toHaveBeenCalled();
    expect(closeBrowser).toHaveBeenCalled();
  });

  it("returns a partial count when load never fires before the timeout", async () => {
    const timeoutError = Object.assign(new Error("Timed out"), {
      name: "TimeoutError"
    });

    const result = await measureCreateElementCountWithBrowserFactory(
      async () => ({
        close: vi.fn().mockResolvedValue(undefined),
        newPage: async () => ({
          addInitScript: vi.fn().mockResolvedValue(undefined),
          close: vi.fn().mockResolvedValue(undefined),
          evaluate: vi.fn().mockResolvedValue({
            count: 847,
            loadFired: false,
            readyState: "interactive"
          }),
          goto: vi.fn().mockResolvedValue({
            status: () => 200
          }),
          setDefaultNavigationTimeout: vi.fn(),
          setDefaultTimeout: vi.fn(),
          title: vi.fn().mockResolvedValue("SKIMS"),
          url: () => "https://skims.com/",
          waitForFunction: vi.fn().mockRejectedValue(timeoutError)
        })
      }),
      {
        timeoutMs: 60_000,
        url: "https://skims.com"
      }
    );

    expect(result.count).toBe(847);
    expect(result.loadFired).toBe(false);
    expect(result.waitedUntil).toBe("timeout");
    expect(result.httpStatus).toBe(200);
    expect(result.readyState).toBe("interactive");
  });
});
