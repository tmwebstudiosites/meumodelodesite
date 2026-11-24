export interface AppConfig {
  env: string;
  version: string;
  sentryDsn: string | undefined;
  otelEndpoint: string | undefined;
  datadog: { applicationId: string; clientToken: string; site: string } | undefined;
  newRelicLoaderUrl: string | undefined;
}

type RawEnv = Record<string, string | boolean | undefined>;

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;

export function readConfig(raw: RawEnv): AppConfig {
  const applicationId = str(raw.VITE_DD_APPLICATION_ID);
  const clientToken = str(raw.VITE_DD_CLIENT_TOKEN);
  return {
    env: str(raw.VITE_APP_ENV) ?? "development",
    version: str(raw.VITE_APP_VERSION) ?? "0.0.0",
    sentryDsn: str(raw.VITE_SENTRY_DSN),
    otelEndpoint: str(raw.VITE_OTEL_ENDPOINT),
    datadog:
      applicationId && clientToken
        ? { applicationId, clientToken, site: str(raw.VITE_DD_SITE) ?? "datadoghq.com" }
        : undefined,
    newRelicLoaderUrl: str(raw.VITE_NEWRELIC_LOADER_URL),
  };
}
