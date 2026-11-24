import * as Sentry from "@sentry/browser";
import type { AppConfig } from "../config";

export function initSentry(cfg: AppConfig): void {
  if (!cfg.sentryDsn) return;
  Sentry.init({
    dsn: cfg.sentryDsn,
    environment: cfg.env,
    release: cfg.version,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: cfg.env === "production" ? 0.2 : 1,
  });
}

export function sentryCapture(error: unknown, context?: Record<string, unknown>): void {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
