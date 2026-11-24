import { afterEach, describe, expect, it, vi } from "vitest";
import { crossfade, DURATION, enter, exit, initReveal, prefersReducedMotion } from "../../src/core/motion";
import { FakeIO, installFakeIO, mockMatchMedia } from "./setup";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

function animatable(finish = true) {
  const el = document.createElement("div");
  const anim = {
    finished: finish ? Promise.resolve() : Promise.reject(new Error("cancel")),
    commitStyles: vi.fn(),
    cancel: vi.fn(),
  };
  const animate = vi.fn(() => anim);
  (el as unknown as { animate: unknown }).animate = animate;
  return { el, animate, anim };
}

describe("tokens", () => {
  it("saídas são mais rápidas que entradas e hover é rápido", () => {
    expect(DURATION.exit).toBeLessThan(DURATION.enter);
    expect(DURATION.fast).toBeLessThanOrEqual(180);
  });
});

describe("prefersReducedMotion", () => {
  it("lê a media query", () => {
    mockMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    mockMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });
  it("é falso sem matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("enter / exit / crossfade", () => {
  it("anima com WAAPI e consolida o estado final", async () => {
    mockMatchMedia(false);
    const { el, animate, anim } = animatable();
    await enter(el, 20);
    expect(animate).toHaveBeenCalledTimes(1);
    const [frames, opts] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(frames[0]).toMatchObject({ opacity: 0, transform: "translateY(20px)" });
    expect(opts.duration).toBe(DURATION.enter);
    expect(anim.commitStyles).toHaveBeenCalled();
    expect(anim.cancel).toHaveBeenCalled();
  });

  it("saída usa duração menor e desloca para baixo", async () => {
    mockMatchMedia(false);
    const { el, animate } = animatable();
    await exit(el, 5);
    const [frames, opts] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(frames[1]).toMatchObject({ opacity: 0, transform: "translateY(5px)" });
    expect(opts.duration).toBe(DURATION.exit);
  });

  it("crossfade só altera opacidade", async () => {
    mockMatchMedia(false);
    const { el, animate } = animatable();
    await crossfade(el);
    expect((animate.mock.calls[0] as unknown as [Keyframe[]])[0]).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  });

  it("não anima com reduced motion (troca instantânea)", async () => {
    mockMatchMedia(true);
    const { el, animate } = animatable();
    await Promise.all([enter(el), exit(el), crossfade(el)]);
    expect(animate).not.toHaveBeenCalled();
  });

  it("não quebra sem el.animate (jsdom/navegador antigo)", async () => {
    mockMatchMedia(false);
    await expect(enter(document.createElement("div"))).resolves.toBeUndefined();
  });

  it("resolve mesmo se a animação for cancelada", async () => {
    mockMatchMedia(false);
    const { el } = animatable(false);
    await expect(enter(el)).resolves.toBeUndefined();
  });
});

describe("initReveal", () => {
  const setup = () => {
    document.body.innerHTML = `<p data-reveal id="a"></p><p data-reveal id="b" class="is-in"></p>`;
  };

  it("revela ao entrar na viewport e para de observar", () => {
    mockMatchMedia(false);
    installFakeIO();
    setup();
    initReveal();
    const io = FakeIO.instances[0] as FakeIO;
    expect(io.observed).toHaveLength(1); // ignora os já revelados
    io.fire(false);
    expect(document.getElementById("a")?.classList.contains("is-in")).toBe(false);
    io.fire(true);
    expect(document.getElementById("a")?.classList.contains("is-in")).toBe(true);
    expect(io.observed).toHaveLength(0);
  });

  it("desconecta pelo cleanup", () => {
    mockMatchMedia(false);
    installFakeIO();
    setup();
    initReveal()();
    expect((FakeIO.instances[0] as FakeIO).disconnected).toBe(true);
  });

  it("mostra tudo de imediato com reduced motion", () => {
    mockMatchMedia(true);
    installFakeIO();
    setup();
    initReveal();
    expect(document.getElementById("a")?.classList.contains("is-in")).toBe(true);
    expect(FakeIO.instances).toHaveLength(0);
  });

  it("mostra tudo sem IntersectionObserver", () => {
    mockMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", undefined);
    setup();
    initReveal();
    expect(document.getElementById("a")?.classList.contains("is-in")).toBe(true);
  });
});
