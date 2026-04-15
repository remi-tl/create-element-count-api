import type { BrowserWorker } from "@cloudflare/playwright";

export interface Env {
  BROWSER: BrowserWorker;
}

export interface CountRequest {
  timeoutMs: number;
  url: string;
}

export interface CountResponse {
  count: number;
  durationMs: number;
  finalUrl: string;
  httpStatus: number | null;
  loadFired: boolean;
  ok: true;
  requestedUrl: string;
  readyState: string;
  timestamp: string;
  title: string;
  waitedUntil: "load" | "timeout";
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
  ok: false;
}

export interface TrackerSnapshot {
  count: number;
  loadFired: boolean;
  readyState: string;
}
