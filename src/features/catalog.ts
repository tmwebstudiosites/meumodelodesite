import { h, qs } from "../core/dom";
import { crossfade, enter, exit } from "../core/motion";
import { track } from "../core/telemetry";
import { type Category, categoriesIn, categoryLabels, filterLooks, type Look, looks } from "../data/catalog";
import { photo } from "../ui/image";

function card(look: Look, i: number, onOpen: (look: Look) => void): HTMLElement {
  const btn = h(
    "button",
    { class: "card__open", type: "button", "aria-label": `Ampliar foto: ${look.title}` },
    photo(look.id),
  );
  btn.addEventListener("click", () => onOpen(look));
  return h(
    "article",
    { class: "card", "data-id": look.id, style: `--i:${i}` },
    btn,
    h(
      "div",
      { class: "card__body" },
      h("span", { class: "chip" }, categoryLabels[look.category]),
      h("h3", {}, look.title),
      h("p", {}, look.note),
    ),
  );
}

export function openLightbox(look: Look): void {
  const dialog = qs<HTMLDialogElement>("#lightbox");
  qs("#lightbox-figure").replaceChildren(
    photo(look.id, { eager: true, sizes: "(min-width: 900px) 520px, 92vw" }),
    h("figcaption", {}, look.title),
  );
  dialog.showModal();
  void enter(dialog, 12);
  track("lightbox_open", { look: look.id });
}

export function initLightbox(): void {
  const dialog = qs<HTMLDialogElement>("#lightbox");
  const close = async () => {
    await exit(dialog, 8);
    dialog.close();
  };
  qs("#lightbox-close").addEventListener("click", () => void close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) void close();
  });
  // Esc (teclado): fecha instantaneamente, sem animar — comportamento nativo do <dialog>.
}

export function mount(root: HTMLElement): void {
  const cats = categoriesIn(looks);
  let active: Category | "todos" = "todos";

  const grid = h("div", { class: "grid", "aria-live": "polite" });
  const chips = h(
    "div",
    { class: "filters", role: "group", "aria-label": "Filtrar por categoria" },
    ...cats.map((c) =>
      h(
        "button",
        { class: "filter", type: "button", "aria-pressed": String(c === active), "data-cat": c },
        categoryLabels[c],
      ),
    ),
  );

  const render = async (next: Category | "todos") => {
    const current = [...grid.children] as HTMLElement[];
    await Promise.all(current.map((el) => exit(el, 6)));
    grid.replaceChildren(...filterLooks(looks, next).map((l, i) => card(l, i, openLightbox)));
    await Promise.all(
      [...grid.children].map((el, i) => new Promise((r) => setTimeout(r, i * 70)).then(() => enter(el, 12))),
    );
  };

  chips.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-cat]");
    if (!btn) return;
    const next = btn.dataset.cat as Category | "todos";
    if (next === active) return;
    active = next;
    for (const b of chips.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b === btn));
    track("catalog_filter", { category: next });
    void render(next);
  });

  grid.replaceChildren(...filterLooks(looks, active).map((l, i) => card(l, i, openLightbox)));
  root.replaceChildren(chips, grid);
  void crossfade(root);
}
