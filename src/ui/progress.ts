import { exit, prefersReducedMotion } from "../core/motion";

export function scrollRatio(scrollTop: number, scrollHeight: number, clientHeight: number): number {
  const max = scrollHeight - clientHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, scrollTop / max));
}

/** Barra de progresso de leitura no topo (transform: scaleX, sem reflow). */
export function initScrollProgress(bar: HTMLElement): () => void {
  const fill = bar.firstElementChild as HTMLElement | null;
  let frame = 0;
  const update = () => {
    frame = 0;
    const d = document.documentElement;
    fill?.style.setProperty(
      "transform",
      `scaleX(${scrollRatio(d.scrollTop, d.scrollHeight, d.clientHeight)})`,
    );
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  addEventListener("scroll", onScroll, { passive: true });
  update();
  return () => removeEventListener("scroll", onScroll);
}

/** Loader inicial: a barra avança com o carregamento real (document.readyState → load) e sai com fade. */
export async function runPageLoader(loader: HTMLElement, fill: HTMLElement): Promise<void> {
  const set = (p: number) => fill.style.setProperty("transform", `scaleX(${p})`);
  set(0.25);
  if (document.readyState !== "complete") {
    set(0.6);
    await new Promise<void>((resolve) => addEventListener("load", () => resolve(), { once: true }));
  }
  set(1);
  if (!prefersReducedMotion()) await new Promise((r) => setTimeout(r, 160));
  await exit(loader, -6);
  loader.hidden = true;
  document.body.removeAttribute("aria-busy");
}
