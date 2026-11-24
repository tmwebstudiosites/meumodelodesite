import { h } from "../core/dom";
import { initReveal } from "../core/motion";
import { track } from "../core/telemetry";
import { faq } from "../data/content";

export function mount(root: HTMLElement): void {
  const items = faq.map((item, i) => {
    const panelId = `faq-panel-${i}`;
    const btn = h(
      "button",
      { class: "faq__q", type: "button", "aria-expanded": "false", "aria-controls": panelId },
      item.q,
      h("i", { "aria-hidden": true }),
    );
    const panel = h(
      "div",
      { class: "faq__a", id: panelId, role: "region" },
      h("div", {}, h("p", {}, item.a)),
    );
    const el = h(
      "div",
      { class: "faq__item", "data-reveal": true, style: `--i:${i}` },
      h("h3", {}, btn),
      panel,
    );
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      el.classList.toggle("is-open", open);
      if (open) track("faq_open", { question: i });
    });
    return el;
  });
  root.replaceChildren(h("div", { class: "faq" }, ...items));
  initReveal(root);
}
