import { h } from "../core/dom";
import { photoMeta } from "../data/photos.generated";

export type PhotoId = keyof typeof photoMeta;

export const imgUrl = (id: string, width: 360 | 640, base = import.meta.env.BASE_URL): string =>
  `${base}img/${id}-${width}.webp`;

/** <figure> com placeholder borrado (LQIP) + skeleton shimmer até a foto real carregar e fazer fade-in. */
export function photo(
  id: PhotoId,
  opts: { eager?: boolean; sizes?: string; base?: string; className?: string } = {},
): HTMLElement {
  const meta = photoMeta[id];
  const base = opts.base ?? import.meta.env.BASE_URL;
  const img = h("img", {
    src: imgUrl(id, 640, base),
    srcset: `${imgUrl(id, 360, base)} 360w, ${imgUrl(id, 640, base)} 640w`,
    sizes: opts.sizes ?? "(min-width: 900px) 30vw, 90vw",
    alt: meta.alt,
    width: meta.width,
    height: meta.height,
    decoding: "async",
    loading: opts.eager ? "eager" : "lazy",
    ...(opts.eager ? { fetchpriority: "high" } : {}),
  });
  const fig = h(
    "figure",
    { class: opts.className ? `photo ${opts.className} is-loading` : "photo is-loading" },
    img,
  );
  fig.style.setProperty("--lqip", `url("${meta.lqip}")`);
  fig.style.aspectRatio = `${meta.width} / ${meta.height}`;

  const done = () => {
    fig.classList.remove("is-loading");
    fig.classList.add("is-loaded");
  };
  if (img.complete && img.naturalWidth > 0) done();
  else {
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", () => fig.classList.replace("is-loading", "is-error"), { once: true });
  }
  return fig;
}
