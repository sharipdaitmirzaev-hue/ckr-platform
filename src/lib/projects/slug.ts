const CYR_TO_LAT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

/** Транслитерация и нормализация slug из названия проекта. */
export function slugifyTitle(title: string) {
  const base = title
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => CYR_TO_LAT[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return base || "project";
}

export function withSlugSuffix(base: string, suffix: string) {
  const clean = suffix.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  return `${base}-${clean || Date.now().toString(36)}`;
}
