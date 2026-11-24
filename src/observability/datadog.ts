import { datadogRum } from "@datadog/browser-rum";
import type { AppConfig } from "../config";

export function initDatadog(cfg: AppConfig): void {
  if (!cfg.datadog) return;
  datadogRum.init({
    applicationId: cfg.datadog.applicationId,
    clientToken: cfg.datadog.clientToken,
    site: cfg.datadog.site,
    service: "modas-a-rigor-web",
    env: cfg.env,
    version: cfg.version,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 0,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: "mask-user-input",
  });
}

export function datadogAction(name: string, ctx?: Record<string, unknown>): void {
  datadogRum.addAction(name, ctx);
}

export function datadogError(error: unknown, ctx?: Record<string, unknown>): void {
  datadogRum.addError(error, ctx);
}
