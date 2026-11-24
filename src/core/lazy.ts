/** Executa `cb` uma única vez quando `el` estiver perto da viewport (ou imediatamente sem IntersectionObserver). */
export function whenVisible(el: Element, cb: () => void, rootMargin = "240px 0px"): () => void {
  if (typeof IntersectionObserver === "undefined") {
    cb();
    return () => undefined;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      cb();
    },
    { rootMargin },
  );
  io.observe(el);
  return () => io.disconnect();
}

export type SectionLoader = () => Promise<{ mount(el: HTMLElement): void | Promise<void> }>;

/** Substitui o skeleton de uma seção pelo conteúdo real, carregando o código sob demanda. */
export function lazySection(
  el: HTMLElement,
  load: SectionLoader,
  onDone: (el: HTMLElement) => void | Promise<void>,
  onError: (err: unknown) => void,
): () => void {
  return whenVisible(el, () => {
    load()
      .then(async (mod) => {
        await mod.mount(el);
        el.removeAttribute("aria-busy");
        el.dataset.state = "ready";
        await onDone(el);
      })
      .catch((err) => {
        el.dataset.state = "error";
        onError(err);
      });
  });
}
