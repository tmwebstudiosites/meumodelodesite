/**
 * Motion tokens e utilitários — design-motion-principles:
 *  - Frequência define a duração: hover/foco ≈ 180ms (alta frequência), entradas de seção 500–700ms.
 *  - Interações iniciadas por teclado nunca animam (foco usa outline instantâneo).
 *  - prefers-reduced-motion: movimento funcional vira troca instantânea; decorativo some.
 */
export const DURATION = { fast: 180, base: 320, enter: 600, exit: 220 } as const;
const EASE = {
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function run(el: Element, keyframes: Keyframe[], duration: number, easing: string): Promise<void> {
  if (prefersReducedMotion() || typeof el.animate !== "function") return Promise.resolve();
  const anim = el.animate(keyframes, { duration, easing, fill: "both" });
  return anim.finished.then(
    () => {
      anim.commitStyles?.();
      anim.cancel();
    },
    () => undefined,
  );
}

export const enter = (el: Element, distance = 14): Promise<void> =>
  run(
    el,
    [
      { opacity: 0, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: "none" },
    ],
    DURATION.enter,
    EASE.out,
  );

/** Saída mais rápida que a entrada (o usuário já decidiu; não faça esperar). */
export const exit = (el: Element, distance = 8): Promise<void> =>
  run(
    el,
    [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: `translateY(${distance}px)` },
    ],
    DURATION.exit,
    EASE.inOut,
  );

export const crossfade = (el: Element): Promise<void> =>
  run(el, [{ opacity: 0 }, { opacity: 1 }], DURATION.base, EASE.out);

/** Revela elementos [data-reveal] quando entram na viewport, com stagger via --i. */
export function initReveal(root: ParentNode = document): () => void {
  const targets = [...root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)")];
  if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
    for (const t of targets) t.classList.add("is-in");
    return () => undefined;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  for (const t of targets) io.observe(t);
  return () => io.disconnect();
}
