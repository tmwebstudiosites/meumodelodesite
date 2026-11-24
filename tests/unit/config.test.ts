import { describe, expect, it } from "vitest";
import { readConfig } from "../../src/config";

describe("readConfig", () => {
  it("usa padrões e desliga tudo sem variáveis", () => {
    const cfg = readConfig({});
    expect(cfg).toEqual({
      env: "development",
      version: "0.0.0",
      sentryDsn: undefined,
      otelEndpoint: undefined,
      datadog: undefined,
      newRelicLoaderUrl: undefined,
    });
  });

  it("ignora valores vazios ou só com espaços e faz trim", () => {
    const cfg = readConfig({ VITE_SENTRY_DSN: "   ", VITE_OTEL_ENDPOINT: "  https://otel/v1/traces " });
    expect(cfg.sentryDsn).toBeUndefined();
    expect(cfg.otelEndpoint).toBe("https://otel/v1/traces");
  });

  it("Datadog exige applicationId E clientToken", () => {
    expect(readConfig({ VITE_DD_APPLICATION_ID: "a" }).datadog).toBeUndefined();
    expect(readConfig({ VITE_DD_CLIENT_TOKEN: "t" }).datadog).toBeUndefined();
    expect(readConfig({ VITE_DD_APPLICATION_ID: "a", VITE_DD_CLIENT_TOKEN: "t" }).datadog).toEqual({
      applicationId: "a",
      clientToken: "t",
      site: "datadoghq.com",
    });
    expect(
      readConfig({ VITE_DD_APPLICATION_ID: "a", VITE_DD_CLIENT_TOKEN: "t", VITE_DD_SITE: "datadoghq.eu" })
        .datadog?.site,
    ).toBe("datadoghq.eu");
  });

  it("ignora valores que não são string", () => {
    expect(readConfig({ VITE_SENTRY_DSN: true }).sentryDsn).toBeUndefined();
  });

  it("lê env, versão e loader do New Relic", () => {
    const cfg = readConfig({
      VITE_APP_ENV: "production",
      VITE_APP_VERSION: "1.2.3",
      VITE_NEWRELIC_LOADER_URL: "https://js-agent.newrelic.com/x.js",
    });
    expect(cfg).toMatchObject({
      env: "production",
      version: "1.2.3",
      newRelicLoaderUrl: "https://js-agent.newrelic.com/x.js",
    });
  });
});
