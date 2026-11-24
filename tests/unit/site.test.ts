import { describe, expect, it } from "vitest";
import { buildContact, instagramUrl, site } from "../../src/data/site";

const base = { whatsapp: "", instagram: "loja", greeting: "Oi!" };

describe("buildContact", () => {
  it("cai para o Instagram quando não há WhatsApp", () => {
    expect(buildContact(base)).toEqual({
      channel: "instagram",
      label: "Chamar no Instagram",
      href: "https://ig.me/m/loja",
    });
  });

  it("usa WhatsApp com mensagem codificada quando há número válido", () => {
    const link = buildContact({ ...base, whatsapp: "5521999998888" });
    expect(link.channel).toBe("whatsapp");
    expect(link.label).toBe("Agendar pelo WhatsApp");
    expect(link.href).toBe("https://wa.me/5521999998888?text=Oi!".replace("Oi!", encodeURIComponent("Oi!")));
  });

  it("limpa máscara do número e aceita mensagem customizada", () => {
    const link = buildContact({ ...base, whatsapp: "+55 (21) 99999-8888" }, "Quero um vestido & sapato");
    expect(link.href).toBe(
      `https://wa.me/5521999998888?text=${encodeURIComponent("Quero um vestido & sapato")}`,
    );
  });

  it("rejeita números curtos demais (sem DDI/DDD)", () => {
    expect(buildContact({ ...base, whatsapp: "999998888" }).channel).toBe("instagram");
    expect(buildContact({ ...base, whatsapp: "55219999988" }).channel).toBe("instagram");
    expect(buildContact({ ...base, whatsapp: "552199999888" }).channel).toBe("whatsapp");
  });

  it("expõe configuração real do site", () => {
    expect(site.instagram).toBe("modasarigorcg");
    expect(instagramUrl).toBe("https://www.instagram.com/modasarigorcg/");
    expect(buildContact().channel).toBe(site.whatsapp ? "whatsapp" : "instagram");
  });
});
