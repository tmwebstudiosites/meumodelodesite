// Gera webp responsivo + placeholder borrado (LQIP) para cada foto fonte.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SRC = process.env.IMG_SRC ?? "/mnt/user-data/uploads";
const OUT = "public/img";
const photos = [
  {
    id: "vestido-verde",
    file: "aa166c03-image.png",
    alt: "Vestido de festa verde-oliva em cetim com corset e fenda",
  },
  {
    id: "traje-menino",
    file: "ed1923f4-image.png",
    crop: { right: 0.07, bottom: 0.04 },
    alt: "Traje infantil cinza com colete e gravata",
  },
  {
    id: "debutante-azul",
    file: "4071687e-image.png",
    alt: "Vestido de debutante azul-gelo com saia de tule em camadas",
  },
];
const WIDTHS = [360, 640];

await mkdir(OUT, { recursive: true });
const meta = {};
for (const p of photos) {
  const full = await sharp(`${SRC}/${p.file}`).metadata();
  const c = p.crop ?? { right: 0, bottom: 0 };
  const region = {
    left: 0,
    top: 0,
    width: Math.round(full.width * (1 - c.right)),
    height: Math.round(full.height * (1 - c.bottom)),
  };
  const src = () => sharp(`${SRC}/${p.file}`).extract(region);
  const { width, height } = region;
  for (const w of WIDTHS) {
    await sharp(`${SRC}/${p.file}`)
      .resize({ width: Math.min(w, width) })
      .webp({ quality: 78 })
      .toFile(`${OUT}/${p.id}-${w}.webp`);
  }
  const lqip = await src().resize(20).blur(1).webp({ quality: 40 }).toBuffer();
  meta[p.id] = { width, height, alt: p.alt, lqip: `data:image/webp;base64,${lqip.toString("base64")}` };
}
await sharp(`${SRC}/f9597c80-image.png`).webp({ quality: 90 }).toFile(`${OUT}/logo.webp`);

const body = `// ARQUIVO GERADO por scripts/optimize-images.mjs — não edite à mão.\nexport const photoMeta = ${JSON.stringify(meta, null, 2)} as const;\n`;
await writeFile("src/data/photos.generated.ts", body);
console.log("ok", Object.keys(meta));
