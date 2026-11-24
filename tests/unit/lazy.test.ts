import { afterEach, describe, expect, it, vi } from "vitest";
import { lazySection, whenVisible } from "../../src/core/lazy";
import { FakeIO, installFakeIO } from "./setup";

afterEach(() => vi.unstubAllGlobals());

describe("whenVisible", () => {
  it("chama o callback uma vez, só quando visível", () => {
    installFakeIO();
    const cb = vi.fn();
    whenVisible(document.createElement("div"), cb);
    const io = FakeIO.instances[0] as FakeIO;
    io.fire(false);
    expect(cb).not.toHaveBeenCalled();
    io.fire(true);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(io.disconnected).toBe(true);
  });

  it("executa na hora sem IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const cb = vi.fn();
    whenVisible(document.createElement("div"), cb)();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("cleanup desconecta", () => {
    installFakeIO();
    whenVisible(document.createElement("div"), vi.fn())();
    expect((FakeIO.instances[0] as FakeIO).disconnected).toBe(true);
  });
});

describe("lazySection", () => {
  const flush = () => new Promise((r) => setTimeout(r, 0));

  it("monta, remove aria-busy e marca como pronto", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const el = document.createElement("div");
    el.setAttribute("aria-busy", "true");
    const mount = vi.fn();
    const done = vi.fn();
    lazySection(el, async () => ({ mount }), done, vi.fn());
    await flush();
    expect(mount).toHaveBeenCalledWith(el);
    expect(el.hasAttribute("aria-busy")).toBe(false);
    expect(el.dataset.state).toBe("ready");
    expect(done).toHaveBeenCalledWith(el);
  });

  it("reporta erro e marca estado de erro", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const el = document.createElement("div");
    const onError = vi.fn();
    const boom = new Error("chunk falhou");
    lazySection(el, () => Promise.reject(boom), vi.fn(), onError);
    await flush();
    expect(onError).toHaveBeenCalledWith(boom);
    expect(el.dataset.state).toBe("error");
  });
});
