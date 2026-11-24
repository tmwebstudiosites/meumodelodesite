import { afterEach, describe, expect, it, vi } from "vitest";
import { h, qs, qsa } from "../../src/core/dom";
import { photoMeta } from "../../src/data/photos.generated";
import { imgUrl, photo } from "../../src/ui/image";
import { buildMarquee } from "../../src/ui/marquee";
import { initScrollProgress, runPageLoader, scrollRatio } from "../../src/ui/progress";
import { mockMatchMedia } from "./setup";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("dom", () => {
  it("h cria elementos com atributos e filhos, ignorando vazios", () => {
    const el = h(
      "a",
      { href: "/x", hidden: true, "data-n": 3, off: false, none: undefined },
      "oi",
      null,
      undefined,
      false,
      h("b", {}, "!"),
    );
    expect(el.outerHTML).toBe('<a href="/x" hidden="" data-n="3">oi<b>!</b></a>');
  });

  it("h não interpreta HTML (anti-XSS)", () => {
    expect(h("p", {}, "<img src=x onerror=alert(1)>").children).toHaveLength(0);
  });

  it("qs lança quando não encontra; qsa devolve array", () => {
    document.body.innerHTML = `<i class="a"></i><i class="a"></i>`;
    expect(qsa(".a")).toHaveLength(2);
    expect(qs(".a")).toBeInstanceOf(HTMLElement);
    expect(() => qs(".nada")).toThrow("Elemento não encontrado: .nada");
  });
});

describe("scrollRatio", () => {
  it.each([
    [0, 1000, 500, 0],
    [250, 1000, 500, 0.5],
    [500, 1000, 500, 1],
    [900, 1000, 500, 1],
    [-10, 1000, 500, 0],
    [10, 400, 500, 0],
  ])("top=%i height=%i client=%i → %f", (t, s, c, expected) => expect(scrollRatio(t, s, c)).toBe(expected));
});

describe("initScrollProgress", () => {
  it("atualiza a barra ao rolar e remove o listener", () => {
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
      cb();
      return 1;
    });
    document.body.innerHTML = `<div id="b"><span></span></div>`;
    const bar = qs("#b");
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 500 });
    const stop = initScrollProgress(bar);
    expect((bar.firstElementChild as HTMLElement).style.transform).toBe("scaleX(0)");
    document.documentElement.scrollTop = 250;
    dispatchEvent(new Event("scroll"));
    expect((bar.firstElementChild as HTMLElement).style.transform).toBe("scaleX(0.5)");
    stop();
    document.documentElement.scrollTop = 500;
    dispatchEvent(new Event("scroll"));
    expect((bar.firstElementChild as HTMLElement).style.transform).toBe("scaleX(0.5)");
  });
});

describe("runPageLoader", () => {
  it("preenche a barra, esconde o loader e libera aria-busy", async () => {
    mockMatchMedia(true);
    document.body.setAttribute("aria-busy", "true");
    document.body.innerHTML = `<div id="l"><span id="f"></span></div>`;
    document.body.setAttribute("aria-busy", "true");
    const loader = qs("#l");
    const fill = qs("#f");
    await runPageLoader(loader, fill);
    expect(fill.style.transform).toBe("scaleX(1)");
    expect(loader.hidden).toBe(true);
    expect(document.body.hasAttribute("aria-busy")).toBe(false);
  });
});

describe("photo", () => {
  it("monta URLs e srcset corretos", () => {
    expect(imgUrl("a", 360, "/site/")).toBe("/site/img/a-360.webp");
    const fig = photo("vestido-verde", { base: "/b/" });
    const img = fig.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("srcset")).toBe(
      "/b/img/vestido-verde-360.webp 360w, /b/img/vestido-verde-640.webp 640w",
    );
    expect(img.alt).toBe(photoMeta["vestido-verde"].alt);
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("começa em skeleton com LQIP e vira loaded no evento load", () => {
    const fig = photo("traje-menino");
    expect(fig.classList.contains("is-loading")).toBe(true);
    expect(fig.style.getPropertyValue("--lqip")).toContain("data:image/webp");
    fig.querySelector("img")?.dispatchEvent(new Event("load"));
    expect(fig.classList.contains("is-loaded")).toBe(true);
    expect(fig.classList.contains("is-loading")).toBe(false);
  });

  it("marca erro e usa prioridade alta quando eager", () => {
    const fig = photo("debutante-azul", { eager: true });
    const img = fig.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("loading")).toBe("eager");
    expect(img.getAttribute("fetchpriority")).toBe("high");
    img.dispatchEvent(new Event("error"));
    expect(fig.classList.contains("is-error")).toBe(true);
  });
});

describe("marquee", () => {
  it("duplica o grupo para o loop contínuo", () => {
    const track = document.createElement("div");
    buildMarquee(track, ["A", "B"]);
    expect(track.querySelectorAll(".marquee__group")).toHaveLength(2);
    expect(track.querySelectorAll(".marquee__group")[0]?.children).toHaveLength(2);
  });
});

describe("photo com classe extra", () => {
  it("preserva is-loaded quando a imagem já estava em cache", () => {
    const fig = photo("vestido-verde", { className: "arch" });
    expect(fig.className).toContain("photo arch");
    fig.querySelector("img")?.dispatchEvent(new Event("load"));
    expect(fig.className).toBe("photo arch is-loaded");
  });
});
