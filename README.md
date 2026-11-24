# Modas a Rigor Ateliê — Noivas e Festa

Site institucional (Vite + TypeScript, sem framework). ~5 kB gzip de JS inicial; seções carregadas sob demanda.

## Rodar
```bash
npm install
npm run dev          # desenvolvimento
npm run build        # produção em dist/
```

## Configurar o contato (IMPORTANTE)
Edite `src/data/site.ts` → `whatsapp: "5521999999999"` (DDI+DDD+número, só dígitos).
Enquanto estiver vazio, os botões levam ao Instagram (`ig.me/m/modasarigorcg`).

## Fotos
Coloque as fotos fonte e rode `IMG_SRC=<pasta> npm run images` (gera webp 360/640 + placeholder borrado).

## Motion (design-motion-principles)
Tokens em `src/core/motion.ts`: hover ≈180 ms; entradas 600 ms; saídas 220 ms; teclado nunca anima (Esc fecha o lightbox na hora);
`prefers-reduced-motion` desliga tudo (CSS + JS). Skeleton em toda seção/foto, lazy-loading (IntersectionObserver + `loading=lazy` + code-splitting),
loader inicial, barra de progresso de leitura, entrada/saída em filtros, menu, lightbox e FAQ.

## Observabilidade (`src/observability`, carregada só se configurada)
Sentry · OpenTelemetry (OTLP/HTTP) · Datadog RUM · New Relic Browser · Web Vitals. Copie `.env.example` para `.env` e preencha.
O app só usa a fachada `core/telemetry` (`track`, `captureError`) — trocar de fornecedor não toca no código das telas.

## Qualidade
| Ferramenta | Comando | O que garante |
|---|---|---|
| Biome | `npm run lint` | lint + formatação |
| dependency-cruiser | `npm run arch` | contrato de camadas, sem ciclos, SDKs só em `observability` |
| Knip | `npm run knip` | sem código/dependência morta |
| Commitlint + Husky | no `git commit` | Conventional Commits |
| Vitest + Codecov | `npm run test:cov` | unitários/integração (limites 85%) |
| Playwright + axe | `npm run test:e2e` | e2e desktop/mobile, acessibilidade, reduced-motion |
| Stryker | `npm run mutation` | teste de mutação (break < 60%) |

`npm run check` roda lint, tipos, arquitetura, knip e testes. CI em `.github/workflows` (inclui upload ao Codecov — defina `CODECOV_TOKEN`).
Localmente, sem Chromium do Playwright: `PW_CHROME_PATH=/usr/bin/google-chrome npm run test:e2e`.
