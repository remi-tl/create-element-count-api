export class AppError extends Error {
  readonly code: string;
  readonly headers: HeadersInit | undefined;
  readonly status: number;

  constructor(status: number, code: string, message: string, headers?: HeadersInit) {
    super(message);
    this.code = code;
    this.headers = headers;
    this.name = "AppError";
    this.status = status;
  }
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error && error.name === "TimeoutError") {
    return new AppError(408, "NAVIGATION_TIMEOUT", error.message || "Timed out waiting for the page load event.");
  }

  if (error instanceof Error) {
    return new AppError(502, "BROWSER_RENDERING_FAILED", error.message);
  }

  return new AppError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
}
