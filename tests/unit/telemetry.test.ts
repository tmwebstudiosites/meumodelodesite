import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachSink, captureError, initTelemetry, resetTelemetry, track } from "../../src/core/telemetry";

beforeEach(() => resetTelemetry());

describe("telemetria (fachada)", () => {
  it("é no-op seguro sem sink", () => {
    expect(() => {
      track("x");
      captureError(new Error("y"));
    }).not.toThrow();
  });

  it("bufferiza eventos antes do sink e descarrega em ordem", () => {
    const calls: string[] = [];
    track("a", { n: 1 });
    captureError("erro", { c: 1 });
    track("b");
    attachSink({ event: (n) => calls.push(`event:${n}`), error: (e) => calls.push(`error:${String(e)}`) });
    expect(calls).toEqual(["event:a", "error:erro", "event:b"]);
  });

  it("depois do sink, envia direto", () => {
    const event = vi.fn();
    const error = vi.fn();
    attachSink({ event, error });
    track("cta_click", { channel: "whatsapp" });
    captureError(new Error("z"), { a: 1 });
    expect(event).toHaveBeenCalledWith("cta_click", { channel: "whatsapp" });
    expect(error).toHaveBeenCalledWith(expect.any(Error), { a: 1 });
  });

  it("limita o buffer a 50 itens", () => {
    for (let i = 0; i < 80; i++) track(`e${i}`);
    const event = vi.fn();
    attachSink({ event, error: vi.fn() });
    expect(event).toHaveBeenCalledTimes(50);
  });

  it("sem configuração, não carrega SDKs e retorna false", async () => {
    await expect(initTelemetry({})).resolves.toBe(false);
  });

  it("captura erros globais e rejeições mesmo desligado", async () => {
    const error = vi.fn();
    await initTelemetry({});
    attachSink({ event: vi.fn(), error });
    window.dispatchEvent(new ErrorEvent("error", { error: new Error("global") }));
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ message: "global" }), undefined);
    const rejection = new Event("unhandledrejection") as Event & { reason?: unknown };
    rejection.reason = "motivo";
    window.dispatchEvent(rejection);
    expect(error).toHaveBeenCalledWith("motivo", undefined);
  });
});
