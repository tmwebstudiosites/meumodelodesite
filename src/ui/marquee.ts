import { h } from "../core/dom";

/** Faixa de palavras em loop. Duplicamos o conteúdo para o loop contínuo; pausa no hover/foco via CSS. */
export function buildMarquee(track: HTMLElement, words: readonly string[]): void {
  const group = () =>
    h("span", { class: "marquee__group" }, ...words.map((w) => h("span", {}, w, h("i", {}, "✦"))));
  track.replaceChildren(group(), group());
}
