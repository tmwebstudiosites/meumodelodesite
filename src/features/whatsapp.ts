import { qsa } from "../core/dom";
import { track } from "../core/telemetry";
import { buildContact, site } from "../data/site";

/** Aponta todos os botões [data-cta] para o canal certo (WhatsApp, ou Instagram enquanto não houver número). */
export function bindCtas(root: ParentNode = document): void {
  const link = buildContact(site);
  for (const a of qsa<HTMLAnchorElement>("[data-cta]", root)) {
    a.href = link.href;
    a.target = "_blank";
    a.rel = "noopener";
    if (a.classList.contains("btn--small") === false) a.textContent = link.label;
    a.addEventListener("click", () =>
      track("cta_click", { channel: link.channel, source: a.dataset.ctaSource ?? "unknown" }),
    );
  }
}
