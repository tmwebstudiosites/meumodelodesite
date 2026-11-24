import type { photoMeta } from "./photos.generated";

export type Category = "festa" | "debutantes" | "trajes";

export interface Look {
  id: keyof typeof photoMeta;
  title: string;
  category: Category;
  note: string;
}

export const categoryLabels: Record<Category | "todos", string> = {
  todos: "Todos",
  festa: "Festa",
  debutantes: "Debutantes",
  trajes: "Trajes",
};

export const looks: readonly Look[] = [
  {
    id: "vestido-verde",
    title: "Verde-oliva em cetim",
    category: "festa",
    note: "Corset estruturado, alças finas e fenda lateral.",
  },
  {
    id: "debutante-azul",
    title: "Azul-gelo de tule",
    category: "debutantes",
    note: "Saia em camadas com brilho e corpete ajustado.",
  },
  {
    id: "traje-menino",
    title: "Colete e gravata",
    category: "trajes",
    note: "Traje cinza completo para os pequenos do cortejo.",
  },
];

export function filterLooks(list: readonly Look[], category: Category | "todos"): Look[] {
  return category === "todos" ? [...list] : list.filter((l) => l.category === category);
}

export function categoriesIn(list: readonly Look[]): Array<Category | "todos"> {
  const seen = new Set<Category>(list.map((l) => l.category));
  return [
    "todos",
    ...(Object.keys(categoryLabels) as Array<Category | "todos">).filter(
      (c) => c !== "todos" && seen.has(c as Category),
    ),
  ];
}
