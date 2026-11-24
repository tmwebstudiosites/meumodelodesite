export const site = {
  name: "Modas a Rigor Ateliê",
  tagline: "Noivas e Festa",
  instagram: "modasarigorcg",
  /** DDI+DDD+número, só dígitos. Ex.: "5521999999999". Vazio = CTA cai para o Instagram. */
  whatsapp: "",
  greeting: "Olá! Vim pelo site da Modas a Rigor e gostaria de agendar um atendimento.",
} as const;

export interface ContactLink {
  href: string;
  label: string;
  channel: "whatsapp" | "instagram";
}

export function buildContact(
  cfg: { whatsapp: string; instagram: string; greeting: string } = site,
  message?: string,
): ContactLink {
  const digits = cfg.whatsapp.replace(/\D/g, "");
  if (digits.length >= 12) {
    return {
      channel: "whatsapp",
      label: "Agendar pelo WhatsApp",
      href: `https://wa.me/${digits}?text=${encodeURIComponent(message ?? cfg.greeting)}`,
    };
  }
  return {
    channel: "instagram",
    label: "Chamar no Instagram",
    href: `https://ig.me/m/${cfg.instagram}`,
  };
}

export const instagramUrl = `https://www.instagram.com/${site.instagram}/`;
