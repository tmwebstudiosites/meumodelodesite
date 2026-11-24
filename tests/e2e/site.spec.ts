import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator("#loader")).toBeHidden();
}

async function scrollThrough(page: Page) {
  for (const id of ["colecoes", "servicos", "sob-medida", "duvidas", "contato"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
  }
}

test("carrega, mostra título e esconde o loader", async ({ page }) => {
  await ready(page);
  await expect(page).toHaveTitle(/Modas a Rigor/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("do seu jeitinho");
  await expect(page.locator("body")).not.toHaveAttribute("aria-busy", "true");
});

test("hero exibe a foto real com fade-in (skeleton → loaded)", async ({ page }) => {
  await ready(page);
  const hero = page.locator("#hero-photo");
  await expect(hero).toHaveClass(/is-loaded/);
  await expect(hero.locator("img")).toHaveJSProperty("complete", true);
});

test("seções abaixo da dobra começam em skeleton e são carregadas sob demanda", async ({ page }) => {
  await ready(page);
  const catalog = page.locator('[data-lazy="catalog"]');
  await expect(catalog).toHaveAttribute("aria-busy", "true");
  await expect(catalog.locator(".skel").first()).toBeAttached();
  await catalog.scrollIntoViewIfNeeded();
  await expect(catalog).toHaveAttribute("data-state", "ready");
  await expect(catalog.locator(".card")).toHaveCount(3);
  await expect(catalog.locator(".skel")).toHaveCount(0);
});

test("fotos do catálogo usam lazy-loading nativo", async ({ page }) => {
  await ready(page);
  await page.locator("#colecoes").scrollIntoViewIfNeeded();
  const imgs = page.locator('[data-lazy="catalog"] img');
  await expect(imgs).toHaveCount(3);
  for (const img of await imgs.all()) await expect(img).toHaveAttribute("loading", "lazy");
});

test("filtro por categoria troca os cards", async ({ page }) => {
  await ready(page);
  await page.locator("#colecoes").scrollIntoViewIfNeeded();
  await expect(page.locator(".card")).toHaveCount(3);
  await page.getByRole("button", { name: "Debutantes" }).click();
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.locator(".card h3")).toHaveText("Azul-gelo de tule");
  await page.getByRole("button", { name: "Todos" }).click();
  await expect(page.locator(".card")).toHaveCount(3);
});

test("lightbox abre pelo clique e fecha com Esc", async ({ page }) => {
  await ready(page);
  await page.locator("#colecoes").scrollIntoViewIfNeeded();
  await page.locator(".card__open").first().click();
  await expect(page.locator("#lightbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#lightbox")).toBeHidden();
});

test("FAQ expande e recolhe", async ({ page }) => {
  await ready(page);
  await page.locator("#duvidas").scrollIntoViewIfNeeded();
  const q = page.getByRole("button", { name: "Posso pedir um modelo sob medida?" });
  await expect(q).toHaveAttribute("aria-expanded", "false");
  await q.click();
  await expect(q).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("O ateliê trabalha com modelos sob medida")).toBeVisible();
  await q.click();
  await expect(q).toHaveAttribute("aria-expanded", "false");
});

test("CTAs apontam para um canal de contato válido", async ({ page }) => {
  await ready(page);
  const hrefs = await page
    .locator("[data-cta]")
    .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
  expect(hrefs.length).toBeGreaterThanOrEqual(3);
  for (const href of hrefs) expect(href).toMatch(/^https:\/\/(wa\.me|ig\.me)\//);
});

test("barra de progresso de leitura acompanha o scroll", async ({ page }) => {
  await ready(page);
  const bar = page.locator("#scroll-progress span");
  // A página cresce quando as seções lazy montam: rolamos até o fim a cada tentativa.
  await expect
    .poll(async () => {
      await page.evaluate(() =>
        scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
      );
      return bar.evaluate((e) => (e as HTMLElement).style.transform);
    })
    .toBe("scaleX(1)");
});

test("sem erros de console nem requisições quebradas", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  await ready(page);
  await scrollThrough(page);
  expect(problems).toEqual([]);
});

test("acessibilidade (axe): sem violações sérias ou críticas", async ({ page }) => {
  await ready(page);
  await scrollThrough(page);
  await page.waitForTimeout(800); // deixa as animações de entrada terminarem
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});

test.describe("prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("conteúdo aparece sem movimento e o loader sai na hora", async ({ page }) => {
    await ready(page);
    await expect(page.locator(".hero h1")).toHaveCSS("opacity", "1");
    await expect(page.locator(".hero h1")).toHaveCSS("transform", "none");
    await expect(page.locator(".marquee__track")).toHaveCSS("animation-name", "none");
  });
});

test.describe("mobile", () => {
  test("menu em gaveta abre, navega e fecha", async ({ page, isMobile }) => {
    test.skip(!isMobile, "apenas viewport móvel");
    await ready(page);
    const btn = page.getByRole("button", { name: "Abrir menu" });
    await btn.click();
    await expect(page.locator("#drawer")).toBeVisible();
    await page.locator("#drawer").getByRole("link", { name: "Serviços" }).click();
    await expect(page.locator("#drawer")).toBeHidden();
    await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
  });

  test("sem rolagem horizontal", async ({ page, isMobile }) => {
    test.skip(!isMobile, "apenas viewport móvel");
    await ready(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
