import { enter, exit } from "../core/motion";

/** Drawer móvel: abre com animação; fecha com animação ao clicar, instantâneo via teclado (Esc). */
export function initDrawer(btn: HTMLButtonElement, drawer: HTMLElement): void {
  let open = false;

  const set = async (next: boolean, animate: boolean) => {
    open = next;
    btn.setAttribute("aria-expanded", String(next));
    btn.setAttribute("aria-label", next ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("no-scroll", next);
    if (next) {
      drawer.hidden = false;
      await enter(drawer, 10);
    } else {
      if (animate) await exit(drawer, 10);
      drawer.hidden = true;
    }
  };

  btn.addEventListener("click", () => void set(!open, true));
  drawer.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) void set(false, true);
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) void set(false, false);
  });
}

export function initHeaderState(header: HTMLElement): void {
  const update = () => header.classList.toggle("is-scrolled", scrollY > 24);
  addEventListener("scroll", update, { passive: true });
  update();
}
