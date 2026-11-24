import { type Metric, onCLS, onINP, onLCP } from "web-vitals";
import type { AppConfig } from "../config";
import { datadogAction, datadogError, initDatadog } from "./datadog";
import { initNewRelic, newRelicAction, newRelicError } from "./newrelic";
import { initOtel, otelSpan } from "./otel";
import { initSentry, sentryCapture } from "./sentry";

/** Inicializa todos os provedores configurados e devolve o "sink" usado pelo core/telemetry. */
export function startObservability(cfg: AppConfig) {
  initSentry(cfg);
  initOtel(cfg);
  initDatadog(cfg);
  initNewRelic(cfg);

  const event = (name: string, attrs: Record<string, string | number | boolean> = {}) => {
    datadogAction(name, attrs);
    newRelicAction(name, attrs);
    otelSpan(name, attrs).end();
  };
  const error = (err: unknown, ctx?: Record<string, unknown>) => {
    sentryCapture(err, ctx);
    datadogError(err, ctx);
    newRelicError(err, ctx);
  };

  const vital = (m: Metric) => event(`web-vital.${m.name}`, { value: Math.round(m.value), rating: m.rating });
  onLCP(vital);
  onCLS(vital);
  onINP(vital);

  return { event, error };
}
