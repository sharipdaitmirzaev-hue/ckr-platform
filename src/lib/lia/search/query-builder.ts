import type { Project } from "@/types";

/**
 * Формирует поисковые запросы по недостающим ресурсам проекта.
 * Пример (производство воды):
 * - линии розлива воды цена
 * - производители оборудования
 * - поставщики ПЭТ бутылки
 * - требования к производству воды
 */
export function buildExternalSearchQueries(
  project: Pick<Project, "title" | "summary" | "category" | "region" | "description">,
  missing: string[],
): string[] {
  const title = project.title.trim() || "бизнес-проект";
  const topic = shortenTopic(title);
  const region = project.region?.trim();
  const blob = `${project.title} ${project.summary} ${project.description}`.toLowerCase();
  const queries: string[] = [];

  const push = (q: string) => {
    const value = q.replace(/\s+/g, " ").trim();
    if (value.length < 4) return;
    if (queries.some((item) => item.toLowerCase() === value.toLowerCase())) {
      return;
    }
    queries.push(value);
  };

  const missingBlob = missing.join(" ").toLowerCase();
  const needsEquipment =
    /оборуд|лини|станк|техник/i.test(missingBlob) ||
    /оборуд|розлив|лини/i.test(blob);
  const needsPackaging =
    /тар|пэт|бутыл|упаков/i.test(missingBlob) ||
    /вод|пэт|бутыл|тар/i.test(blob);
  const needsPremises = /помещен|земл|цех|склад|аренд/i.test(missingBlob);
  const needsInvestment = /инвест|капитал|финанс/i.test(missingBlob);
  const needsSpecialists = /специалист|кадр|эксперт|команд/i.test(missingBlob);
  const needsPartners = /партн|поставщик/i.test(missingBlob);

  if (needsEquipment || missing.length === 0) {
    if (/вод/i.test(blob) || /вод/i.test(topic)) {
      push(`линии розлива воды цена`);
      push(`производители оборудования для розлива воды`);
    } else {
      push(`производители оборудования ${topic}`);
      push(`${topic} оборудование цена`);
    }
  }

  if (needsPackaging || /вод/i.test(topic)) {
    push(`поставщики ПЭТ бутылки`);
    if (!/вод/i.test(topic)) {
      push(`поставщики тары упаковки ${topic}`);
    }
  }

  if (needsPremises) {
    push(
      region
        ? `аренда производственного помещения ${region}`
        : `аренда производственного помещения ${topic}`,
    );
  }

  if (needsInvestment) {
    push(`инвестиции в ${topic} ${region || ""}`.trim());
  }

  if (needsSpecialists) {
    push(`специалисты для ${topic}`);
  }

  if (needsPartners) {
    push(`поставщики и партнёры ${topic}`);
  }

  // Нормативные / отраслевые требования
  push(`требования к производству ${topic}`);
  if (/вод/i.test(topic) || /вод/i.test(blob)) {
    push(`требования к производству питьевой воды`);
  }

  // Запросы напрямую из списка missing (свободный текст)
  for (const item of missing.slice(0, 4)) {
    if (item.length >= 4 && !/регион:|отрасль:|стадия:/i.test(item)) {
      push(`${item} ${topic}`);
    }
  }

  return queries.slice(0, 6);
}

function shortenTopic(title: string) {
  return title
    .replace(/^(проект|производство|создание)\s+/i, "")
    .trim()
    .slice(0, 80);
}
