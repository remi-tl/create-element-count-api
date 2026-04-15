import { normalizeError } from "./errors";
import type { CountResponse, Env, ErrorResponse } from "./types";
import { parseCountRequest } from "./request";
import { renderHomePage } from "./ui";

interface MeasureCreateElementCount {
  (browserBinding: Env["BROWSER"], request: { timeoutMs: number; url: string }): Promise<CountResponse>;
}

interface Dependencies {
  measureCreateElementCount: MeasureCreateElementCount;
}

export function createWorker(dependencies: Dependencies) {
  return {
    async fetch(request: Request, env: Env): Promise<Response> {
      try {
        if (request.method === "GET" && new URL(request.url).pathname === "/") {
          return htmlResponse(renderHomePage());
        }

        const countRequest = await parseCountRequest(request);
        const response = await dependencies.measureCreateElementCount(env.BROWSER, countRequest);

        return jsonResponse<CountResponse>(response, 200);
      } catch (error) {
        const appError = normalizeError(error);

        return jsonResponse<ErrorResponse>(
          {
            error: {
              code: appError.code,
              message: appError.message
            },
            ok: false
          },
          appError.status,
          appError.headers
        );
      }
    }
  };
}

function jsonResponse<T>(payload: T, status: number, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      ...headers
    },
    status
  });
}

function htmlResponse(html: string): Response {
  return new Response(html, {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8"
    },
    status: 200
  });
}
