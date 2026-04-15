import { describe, expect, it, vi } from "vitest";
import type { BrowserWorker } from "@cloudflare/playwright";

import { createWorker } from "./app";
import { COUNT_ENDPOINT_PATH } from "./request";
import type { CountResponse, Env } from "./types";

const requestUrl = `https://worker.example.com${COUNT_ENDPOINT_PATH}`;

describe("createWorker", () => {
  it("serves a browser UI at the root route", async () => {
    const worker = createWorker({
      measureCreateElementCount: vi.fn()
    });

    const response = await worker.fetch(
      new Request("https://worker.example.com/"),
      buildEnv()
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    await expect(response.text()).resolves.toContain("CreateElement Count");
  });

  it("returns the count payload from the browser measurement helper", async () => {
    const payload: CountResponse = {
      count: 1337,
      durationMs: 2876,
      finalUrl: "https://example.com/",
      httpStatus: 200,
      loadFired: true,
      ok: true,
      readyState: "complete",
      requestedUrl: "https://example.com",
      timestamp: "2026-04-08T18:00:00.000Z",
      title: "Example Domain",
      waitedUntil: "load"
    };

    const measureCreateElementCount = vi.fn().mockResolvedValue(payload);
    const worker = createWorker({ measureCreateElementCount });

    const response = await worker.fetch(
      buildRequest({
        url: "https://example.com"
      }),
      buildEnv()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
    expect(measureCreateElementCount).toHaveBeenCalledWith(expect.anything(), {
      timeoutMs: 30000,
      url: "https://example.com/"
    });
  });

  it("maps timeout failures to a 408 response", async () => {
    const timeoutError = Object.assign(new Error("Navigation timeout exceeded"), {
      name: "TimeoutError"
    });

    const worker = createWorker({
      measureCreateElementCount: vi.fn().mockRejectedValue(timeoutError)
    });

    const response = await worker.fetch(
      buildRequest({
        url: "https://example.com"
      }),
      buildEnv()
    );

    expect(response.status).toBe(408);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "NAVIGATION_TIMEOUT",
        message: "Navigation timeout exceeded"
      },
      ok: false
    });
  });

});

function buildEnv(): Env {
  return {
    BROWSER: {} as BrowserWorker
  };
}

function buildRequest(body: unknown): Request {
  return new Request(requestUrl, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
}
