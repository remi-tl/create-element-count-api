import { launch, limits, type BrowserWorker } from "@cloudflare/playwright";

import { launchBrowserWithRetries } from "./browser-launch";
import { AppError } from "./errors";
import { measureCreateElementCountWithBrowserFactory } from "./measure-core";
import type { CountRequest, CountResponse } from "./types";

export async function measureCreateElementCount(
  browserBinding: BrowserWorker | undefined,
  request: CountRequest
): Promise<CountResponse> {
  if (!browserBinding) {
    throw new AppError(500, "MISSING_BROWSER_BINDING", "Browser Rendering binding is not configured.");
  }

  const currentLimits = await limits(browserBinding);
  if (currentLimits.allowedBrowserAcquisitions < 1) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(currentLimits.timeUntilNextAllowedBrowserAcquisition / 1000)
    );

    throw new AppError(
      429,
      "BROWSER_RATE_LIMITED",
      `Cloudflare Browser Rendering is temporarily out of new browser acquisitions for this account. Retry in about ${retryAfterSeconds} seconds.`,
      {
        "Retry-After": String(retryAfterSeconds)
      }
    );
  }

  return measureCreateElementCountWithBrowserFactory(
    () =>
      launchBrowserWithRetries(() =>
        launch(browserBinding, {
          keep_alive: Math.min(Math.max(request.timeoutMs + 15_000, 120_000), 600_000)
        })
      ),
    request
  );
}
