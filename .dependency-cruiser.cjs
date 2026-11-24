/**
 * Contrato de arquitetura (arch-contract).
 * Camadas, da mais baixa para a mais alta:
 *   config < observability < core < data < ui < features < main
 * Uma camada só pode importar camadas MAIS BAIXAS.
 */
const layers = ["config", "observability", "core", "data", "ui", "features", "main"];
const pathOf = (l) => (l === "config" || l === "main" ? `^src/${l}\\.ts$` : `^src/${l}/`);

const layerRules = layers.slice(0, -1).map((layer, i) => ({
  name: `layer-${layer}-nao-importa-camadas-superiores`,
  severity: "error",
  comment: `A camada "${layer}" não pode depender de ${layers.slice(i + 1).join(", ")}.`,
  from: { path: pathOf(layer) },
  to: { path: layers.slice(i + 1).map(pathOf) },
}));

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    ...layerRules,
    { name: "sem-circulares", severity: "error", from: {}, to: { circular: true } },
    {
      name: "sem-vendors-de-telemetria-fora-de-observability",
      severity: "error",
      comment: "SDKs de telemetria só podem ser importados em src/observability (o resto usa core/telemetry).",
      from: { pathNot: "^src/observability/" },
      to: { path: "node_modules/(@sentry|@opentelemetry|@datadog|web-vitals)" },
    },
    {
      name: "testes-nao-entram-no-codigo",
      severity: "error",
      from: { path: "^src/" },
      to: { path: "^tests/" },
    },
    { name: "sem-orfaos", severity: "warn", from: { orphan: true, pathNot: ["\\.d\\.ts$", "^src/main\\.ts$"] }, to: {} },
  ],
  options: {
    parser: "swc",
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require", "node", "default"] },
  },
};
