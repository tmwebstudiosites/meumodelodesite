import { h } from "../core/dom";
import { initReveal } from "../core/motion";
import { steps } from "../data/content";

export function mount(root: HTMLElement): void {
  const list = h(
    "ol",
    { class: "steps" },
    ...steps.map((s, i) =>
      h(
        "li",
        { class: "step", "data-reveal": true, style: `--i:${i}` },
        h("span", { class: "step__dot", "aria-hidden": true }),
        h("h3", {}, s.title),
        h("p", {}, s.text),
      ),
    ),
  );
  root.replaceChildren(list);
  initReveal(root);
}
