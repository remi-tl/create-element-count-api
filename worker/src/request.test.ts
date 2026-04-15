import { describe, expect, it } from "vitest";

import {
  COUNT_ENDPOINT_PATH,
  DEFAULT_TIMEOUT_MS,
  MAX_TIMEOUT_MS,
  MIN_TIMEOUT_MS,
  parseCountRequest
} from "./request";

const requestUrl = `https://worker.example.com${COUNT_ENDPOINT_PATH}`;

describe("parseCountRequest", () => {
  it("rejects non-POST methods", async () => {
    const request = new Request(requestUrl, {
      method: "GET"
    });

    await expect(
      parseCountRequest(request)
    ).rejects.toMatchObject({
      code: "METHOD_NOT_ALLOWED",
      status: 405
    });
  });

  it("defaults timeoutMs when it is omitted", async () => {
    const request = buildRequest({
      url: "https://example.com"
    });

    await expect(parseCountRequest(request)).resolves.toEqual({
      timeoutMs: DEFAULT_TIMEOUT_MS,
      url: "https://example.com/"
    });
  });

  it("clamps timeoutMs into the supported range", async () => {
    const shortRequest = buildRequest({
      timeoutMs: 100,
      url: "https://example.com"
    });

    const longRequest = buildRequest({
      timeoutMs: 120_000,
      url: "https://example.com"
    });

    await expect(parseCountRequest(shortRequest)).resolves.toMatchObject({
      timeoutMs: MIN_TIMEOUT_MS
    });

    await expect(parseCountRequest(longRequest)).resolves.toMatchObject({
      timeoutMs: MAX_TIMEOUT_MS
    });
  });

  it("rejects invalid URLs", async () => {
    const request = buildRequest({
      url: "ftp://example.com/file.txt"
    });

    await expect(parseCountRequest(request)).rejects.toMatchObject({
      code: "INVALID_URL",
      status: 400
    });
  });
});

function buildRequest(body: unknown): Request {
  return new Request(requestUrl, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
}
