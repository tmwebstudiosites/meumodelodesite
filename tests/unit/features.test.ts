import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { qs } from "../../src/core/dom";
import { attachSink, resetTelemetry } from "../../src/core/telemetry";
import { initDrawer, initHeaderState } from "../../src/ui/nav";
import { mockMatchMedia } from "./setup";

beforeEach(() => {
  mockMatchMedia(true); // sem animação: estados mudam na hora
  resetTelemetry();
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
  document.body.className = "";
});

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("features/catalog", () => {
  it("renderiza todos os looks e filtra ao clicar, com telemetria", async () => {
    const { mount } = await import("../../src/features/catalog");
    const events: string[] = [];
    attachSink({ event: (n, a) => events.push(`${n}:${JSON.stringify(a)}`), error: vi.fn() });
    const root = document.createElement("div");
    document.body.append(root);
    mount(root);
    expect(root.querySelectorAll(".card")).toHaveLength(3);
    expect(root.querySelector('[data-cat="todos"]')?.getAttribute("aria-pressed")).toBe("true");

    (root.querySelector('[data-cat="festa"]') as HTMLButtonElement).click();
    await tick();
    await tick();
    expect(root.querySelectorAll(".card")).toHaveLength(1);
    expect(root.querySelector(".card")?.getAttribute("data-id")).toBe("vestido-verde");
    expect(root.querySelector('[data-cat="festa"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector('[data-cat="todos"]')?.getAttribute("aria-pressed")).toBe("false");
    expect(events).toContain('catalog_filter:{"category":"festa"}');

    // clicar na categoria já ativa não re-renderiza
    const before = root.querySelector(".card");
    (root.querySelector('[data-cat="festa"]') as HTMLButtonElement).click();
    await tick();
    expect(root.querySelector(".card")).toBe(before);
  });

  it("abre e fecha o lightbox", async () => {
    document.body.innerHTML = `<dialog id="lightbox"><button id="lightbox-close"></button><figure id="lightbox-figure"></figure></dialog>`;
    const dialog = qs<HTMLDialogElement>("#lightbox");
    dialog.showModal = vi.fn(() => dialog.setAttribute("open", ""));
    dialog.close = vi.fn(() => dialog.removeAttribute("open"));
    const { initLightbox, openLightbox } = await import("../../src/features/catalog");
    const { looks } = await import("../../src/data/catalog");
    initLightbox();
    openLightbox(looks[0] as (typeof looks)[number]);
    expect(dialog.showModal).toHaveBeenCalled();
    expect(qs("#lightbox-figure figcaption").textContent).toBe(looks[0]?.title);
    qs("#lightbox-close").click();
    await tick();
    await tick();
    expect(dialog.close).toHaveBeenCalled();
    openLightbox(looks[1] as (typeof looks)[number]);
    dialog.click(); // clique no backdrop
    await tick();
    await tick();
    expect(dialog.close).toHaveBeenCalledTimes(2);
  });
});

describe("features/faq", () => {
  it("alterna aria-expanded e classe is-open", async () => {
    const { mount } = await import("../../src/features/faq");
    const root = document.createElement("div");
    mount(root);
    const q = root.querySelector(".faq__q") as HTMLButtonElement;
    expect(q.getAttribute("aria-expanded")).toBe("false");
    q.click();
    expect(q.getAttribute("aria-expanded")).toBe("true");
    expect(q.closest(".faq__item")?.classList.contains("is-open")).toBe(true);
    q.click();
    expect(q.getAttribute("aria-expanded")).toBe("false");
    expect(q.getAttribute("aria-controls")).toBe(root.querySelector(".faq__a")?.id);
  });
});

describe("features/services e steps", () => {
  it("renderizam listas ordenadas com itens revelados", async () => {
    const services = await import("../../src/features/services");
    const steps = await import("../../src/features/steps");
    const a = document.createElement("div");
    const b = document.createElement("div");
    services.mount(a);
    steps.mount(b);
    expect(a.querySelectorAll("li.service")).toHaveLength(5);
    expect(a.querySelector(".service__n")?.textContent).toBe("01");
    expect(b.querySelectorAll("li.step")).toHaveLength(4);
    expect(a.querySelector("li")?.classList.contains("is-in")).toBe(true);
  });
});

describe("features/whatsapp", () => {
  it("liga todos os CTAs ao canal e registra clique", async () => {
    document.body.innerHTML = `<a data-cta data-cta-source="hero">x</a><a data-cta class="btn--small">y</a>`;
    const event = vi.fn();
    attachSink({ event, error: vi.fn() });
    const { bindCtas } = await import("../../src/features/whatsapp");
    bindCtas();
    const [a, b] = [...document.querySelectorAll<HTMLAnchorElement>("[data-cta]")] as [
      HTMLAnchorElement,
      HTMLAnchorElement,
    ];
    expect(a.href).toContain("ig.me/m/modasarigorcg");
    expect(a.textContent).toBe("Chamar no Instagram");
    expect(b.textContent).toBe("y"); // botão pequeno mantém o rótulo curto
    expect(a.rel).toBe("noopener");
    a.dispatchEvent(new MouseEvent("click"));
    expect(event).toHaveBeenCalledWith("cta_click", { channel: "instagram", source: "hero" });
  });
});

describe("ui/nav", () => {
  const setup = () => {
    document.body.innerHTML = `<header id="h"></header><button id="b" aria-expanded="false"></button><div id="d" hidden><a href="#x">x</a></div>`;
    const btn = qs<HTMLButtonElement>("#b");
    const drawer = qs("#d");
    initDrawer(btn, drawer);
    return { btn, drawer };
  };

  it("abre e fecha pelo botão, travando o scroll", async () => {
    const { btn, drawer } = setup();
    btn.click();
    await tick();
    expect(drawer.hidden).toBe(false);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(btn.getAttribute("aria-label")).toBe("Fechar menu");
    expect(document.body.classList.contains("no-scroll")).toBe(true);
    btn.click();
    await tick();
    expect(drawer.hidden).toBe(true);
    expect(document.body.classList.contains("no-scroll")).toBe(false);
  });

  it("fecha ao clicar num link e com Esc", async () => {
    const { btn, drawer } = setup();
    btn.click();
    await tick();
    (drawer.querySelector("a") as HTMLAnchorElement).click();
    await tick();
    expect(drawer.hidden).toBe(true);
    btn.click();
    await tick();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await tick();
    expect(drawer.hidden).toBe(true);
  });

  it("marca o header ao rolar", () => {
    document.body.innerHTML = `<header id="h"></header>`;
    const header = qs("#h");
    vi.stubGlobal("scrollY", 100);
    initHeaderState(header);
    expect(header.classList.contains("is-scrolled")).toBe(true);
    vi.stubGlobal("scrollY", 0);
    dispatchEvent(new Event("scroll"));
    expect(header.classList.contains("is-scrolled")).toBe(false);
  });
});
