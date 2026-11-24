import { qs, qsa } from "./core/dom";
import { lazySection, type SectionLoader } from "./core/lazy";
import { crossfade, initReveal } from "./core/motion";
import { captureError, initTelemetry, track } from "./core/telemetry";
import { marquee } from "./data/content";
import { bindCtas } from "./features/whatsapp";
import { photo } from "./ui/image";
import { buildMarquee } from "./ui/marquee";
import { initDrawer, initHeaderState } from "./ui/nav";
import { initScrollProgress, runPageLoader } from "./ui/progress";

const sections: Record<string, SectionLoader> = {
  catalog: async () => {
    const mod = await import("./features/catalog");
    mod.initLightbox();
    return mod;
  },
  services: () => import("./features/services"),
  steps: () => import("./features/steps"),
  faq: () => import("./features/faq"),
};

function boot(): void {
  void initTelemetry(import.meta.env);

  qs("#year").textContent = String(new Date().getFullYear());
  bindCtas();
  buildMarquee(qs("#marquee"), marquee);
  initHeaderState(qs("#header"));
  initScrollProgress(qs("#scroll-progress"));
  initDrawer(qs<HTMLButtonElement>("#menu-btn"), qs("#drawer"));

  // Foto do hero: carregada de imediato, com LQIP + fade.
  const hero = qs("#hero-photo");
  hero.replaceWith(
    Object.assign(
      photo("vestido-verde", { eager: true, sizes: "(min-width: 900px) 34vw, 80vw", className: "arch" }),
      {
        id: "hero-photo",
      },
    ),
  );

  initReveal();

  for (const el of qsa<HTMLElement>("[data-lazy]")) {
    const loader = sections[el.dataset.lazy ?? ""];
    if (!loader) continue;
    lazySection(
      el,
      loader,
      (done) => {
        track("section_ready", { section: done.dataset.lazy ?? "" });
        return crossfade(done);
      },
      (err) => captureError(err, { section: el.dataset.lazy }),
    );
  }

  void runPageLoader(qs("#loader"), qs("#loader-fill"));
}

boot();
