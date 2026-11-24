import { h } from "../core/dom";
import { initReveal } from "../core/motion";
import { services } from "../data/content";

export function mount(root: HTMLElement): void {
  const list = h(
    "ol",
    { class: "services" },
    ...services.map((s, i) =>
      h(
        "li",
        { class: "service", "data-reveal": true, style: `--i:${i}` },
        h("span", { class: "service__n" }, String(i + 1).padStart(2, "0")),
        h("h3", {}, s.title),
        h("p", {}, s.text),
      ),
    ),
  );
  root.replaceChildren(list);
  initReveal(root);
}
