import { type Span, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor, WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import type { AppConfig } from "../config";

const TRACER = "modas-a-rigor-web";

export function initOtel(cfg: AppConfig): void {
  if (!cfg.otelEndpoint) return;
  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      "service.name": TRACER,
      "service.version": cfg.version,
      "deployment.environment": cfg.env,
    }),
    spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter({ url: cfg.otelEndpoint }))],
  });
  provider.register();
  new FetchInstrumentation().setTracerProvider(provider);
}

export function otelSpan(name: string, attrs: Record<string, string | number | boolean> = {}): Span {
  const span = trace.getTracer(TRACER).startSpan(name);
  span.setAttributes(attrs);
  return span;
}
