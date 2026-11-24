import type { AppConfig } from "../config";

interface NewRelicAgent {
  addPageAction(name: string, attrs?: Record<string, unknown>): void;
  noticeError(error: unknown, attrs?: Record<string, unknown>): void;
}

const agent = (): NewRelicAgent | undefined => (globalThis as { newrelic?: NewRelicAgent }).newrelic;

/** O New Relic Browser é um loader gerado no painel: injetamos o script de forma assíncrona. */
export function initNewRelic(cfg: AppConfig): void {
  if (!cfg.newRelicLoaderUrl) return;
  const script = document.createElement("script");
  script.src = cfg.newRelicLoaderUrl;
  script.async = true;
  document.head.append(script);
}

export function newRelicAction(name: string, attrs?: Record<string, unknown>): void {
  agent()?.addPageAction(name, attrs);
}

export function newRelicError(error: unknown, attrs?: Record<string, unknown>): void {
  agent()?.noticeError(error, attrs);
}
