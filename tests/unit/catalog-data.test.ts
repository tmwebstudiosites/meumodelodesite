import { describe, expect, it } from "vitest";
import { categoriesIn, categoryLabels, filterLooks, looks } from "../../src/data/catalog";
import { photoMeta } from "../../src/data/photos.generated";

describe("catálogo", () => {
  it("todo look aponta para uma foto existente", () => {
    for (const l of looks) expect(photoMeta[l.id]).toBeDefined();
  });

  it("filtra por categoria e 'todos' devolve cópia", () => {
    expect(filterLooks(looks, "festa").map((l) => l.id)).toEqual(["vestido-verde"]);
    const all = filterLooks(looks, "todos");
    expect(all).toHaveLength(looks.length);
    expect(all).not.toBe(looks);
  });

  it("categoria sem looks retorna vazio", () => {
    expect(filterLooks([], "festa")).toEqual([]);
  });

  it("lista só categorias presentes, começando por 'todos' e respeitando a ordem dos rótulos", () => {
    expect(categoriesIn(looks)).toEqual(["todos", "festa", "debutantes", "trajes"]);
    expect(categoriesIn(looks.filter((l) => l.category !== "festa"))).toEqual([
      "todos",
      "debutantes",
      "trajes",
    ]);
    expect(categoriesIn([])).toEqual(["todos"]);
  });

  it("tem rótulo para cada categoria", () => {
    for (const l of looks) expect(categoryLabels[l.category]).toBeTruthy();
  });
});
