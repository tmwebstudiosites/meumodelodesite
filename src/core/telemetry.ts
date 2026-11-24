import { readConfig } from "../config";

export type Attrs = Record<string, string | number | boolean>;
export interface Sink {
  event(name: string, attrs?: Attrs): void;
  error(err: unknown, ctx?: Record<string, unknown>): void;
}

let sink: Sink | undefined;
const buffer: Array<() => void> = [];

/** Fachada única de telemetria: o resto do app nunca importa SDKs de fornecedores. */
export function track(name: string, attrs?: Attrs): void {
  if (sink) sink.event(name, attrs);
  else if (buffer.length < 50) buffer.push(() => sink?.event(name, attrs));
}

export function captureError(err: unknown, ctx?: Record<string, unknown>): void {
  if (sink) sink.error(err, ctx);
  else if (buffer.length < 50) buffer.push(() => sink?.error(err, ctx));
}

export function attachSink(next: Sink): void {
  sink = next;
  for (const fn of buffer.splice(0)) fn();
}

export function resetTelemetry(): void {
  sink = undefined;
  buffer.length = 0;
}

/** Carrega os SDKs sob demanda (code-splitting) apenas se houver algo configurado. */
export async function initTelemetry(raw: Record<string, string | boolean | undefined>): Promise<boolean> {
  const cfg = readConfig(raw);
  const enabled = Boolean(cfg.sentryDsn || cfg.otelEndpoint || cfg.datadog || cfg.newRelicLoaderUrl);

  window.addEventListener("error", (e) => captureError(e.error ?? e.message));
  window.addEventListener("unhandledrejection", (e) => captureError(e.reason));
  if (!enabled) return false;

  try {
    const { startObservability } = await import("../observability");
    attachSink(startObservability(cfg));
    return true;
  } catch (err) {
    console.warn("[telemetria] falha ao iniciar", err);
    return false;
  }
}
