import { AppError } from "./errors";
import type { CountRequest } from "./types";

export const COUNT_ENDPOINT_PATH = "/api/create-element-count";
export const DEFAULT_TIMEOUT_MS = 30_000;
export const MAX_TIMEOUT_MS = 60_000;
export const MIN_TIMEOUT_MS = 5_000;

interface CountRequestBody {
  timeoutMs?: unknown;
  url?: unknown;
}

export async function parseCountRequest(request: Request): Promise<CountRequest> {
  assertEndpoint(request);
  assertMethod(request);

  const body = await parseJsonBody(request);

  return {
    timeoutMs: normalizeTimeoutMs(body.timeoutMs),
    url: normalizeUrl(body.url)
  };
}

function assertEndpoint(request: Request): void {
  const url = new URL(request.url);
  const normalizedPath = url.pathname.endsWith("/") && url.pathname !== "/"
    ? url.pathname.slice(0, -1)
    : url.pathname;

  if (normalizedPath !== COUNT_ENDPOINT_PATH) {
    throw new AppError(404, "NOT_FOUND", "Route not found.");
  }
}

function assertMethod(request: Request): void {
  if (request.method !== "POST") {
    throw new AppError(405, "METHOD_NOT_ALLOWED", "Use POST for this endpoint.", {
      Allow: "POST"
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeTimeoutMs(value: unknown): number {
  if (value === undefined || value === null) {
    return DEFAULT_TIMEOUT_MS;
  }

  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new AppError(400, "INVALID_TIMEOUT", "timeoutMs must be a finite number.");
  }

  return Math.max(MIN_TIMEOUT_MS, Math.min(MAX_TIMEOUT_MS, Math.round(value)));
}

function normalizeUrl(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(400, "INVALID_URL", "url must be a non-empty string.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch (_error) {
    throw new AppError(400, "INVALID_URL", "url must be an absolute http or https URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError(400, "INVALID_URL", "url must use http or https.");
  }

  return url.toString();
}

async function parseJsonBody(request: Request): Promise<CountRequestBody> {
  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch (_error) {
    throw new AppError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  if (!isRecord(parsedBody)) {
    throw new AppError(400, "INVALID_BODY", "Request body must be a JSON object.");
  }

  return parsedBody;
}
