import {
  ENTREPRENEUR_PUBLIC_PATH,
  EXPERT_PUBLIC_BLOCKS,
  INVESTOR_PUBLIC_BLOCKS,
  ORGANIZATION_PUBLIC_BLOCKS,
} from "@/config/public-website";

export type RoleLandingContent = {
  slug: "entrepreneurs" | "investors" | "experts" | "organizations";
  href: string;
  eyebrow: string;
  title: string;
  problem: string;
  solution: string;
  advantages: string[];
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  /** Сценарий работы (этап 48 / 65). */
  scenario?: string[];
  /** Дополнительные блоки упаковки (этап 65). */
  blocks?: ReadonlyArray<{ title: string; text: string; href: string }>;
};

export const roleLandings: Record<
  RoleLandingContent["slug"],
  RoleLandingContent
> = {
  entrepreneurs: {
    slug: "entrepreneurs",
    href: "/entrepreneur",
    eyebrow: "Для предпринимателей",
    title: "От идеи до развития — с Лией и экосистемой ЦКР",
    problem:
      "Идея есть, а земли, оборудования, капитала и команды не хватает. Поиск по частям занимает месяцы и не даёт цельной картины.",
    solution:
      "ЦКР помогает пройти путь: идея → анализ Лии → проект → эксперты → партнёры → развитие. Первый шаг — аудит или сценарий «От идеи до проекта».",
    advantages: [
      "Аудит бизнеса и BusinessAuditReport с Лией",
      "Создание проекта за минуты",
      "Каталоги возможностей, экспертов и инвестиций",
      "Сопровождение сделок и этапов до результата",
    ],
    ctaPrimary: {
      label: "Получить аудит бизнеса",
      href: "/lia?scenario=business_audit",
    },
    ctaSecondary: {
      label: "Разместить проект",
      href: "/register?next=/dashboard/projects/create",
    },
    scenario: [...ENTREPRENEUR_PUBLIC_PATH],
  },
  investors: {
    slug: "investors",
    href: "/investor",
    eyebrow: "Для инвесторов",
    title: "Проекты, возможности и интересы в одном контуре",
    problem:
      "Сложно найти проверенные проекты в нужном регионе и отрасли, согласовать условия и не потерять контекст переговоров.",
    solution:
      "ЦКР собирает опубликованные проекты и возможности, позволяет отметить интерес и вести диалоги в прозрачной среде с верификацией участников.",
    advantages: [
      "Каталог проектов с фильтрами",
      "Возможности и инвестиционные предложения",
      "Интересы и заявки в кабинете",
      "Аналитика статусов и взаимодействий",
    ],
    ctaPrimary: {
      label: "Смотреть проекты",
      href: "/projects",
    },
    ctaSecondary: {
      label: "Каталог инвестиций",
      href: "/investments",
    },
    scenario: [
      "Регистрация",
      "Каталог проектов",
      "Интерес",
      "Сделка в контуре ЦКР",
    ],
    blocks: [...INVESTOR_PUBLIC_BLOCKS],
  },
  experts: {
    slug: "experts",
    href: "/expert",
    eyebrow: "Для экспертов",
    title: "Компетенции и репутация рядом с реальными проектами",
    problem:
      "Сложно найти проекты, которым нужна именно ваша компетенция, и выстроить доверие без лишней рекламы.",
    solution:
      "ЦКР публикует профиль эксперта, связывает с проектами региона и позволяет принимать заявки на сопровождение — с репутацией внутри экосистемы.",
    advantages: [
      "Публичный профиль с верификацией",
      "Участие в проектах через заявки",
      "Репутация и доверие в ЦКР",
      "Сопровождение этапов в workspace",
    ],
    ctaPrimary: {
      label: "Стать экспертом",
      href: "/register?role=expert",
    },
    ctaSecondary: {
      label: "Каталог экспертов",
      href: "/experts#catalog",
    },
    scenario: [
      "Профиль",
      "Компетенции",
      "Репутация",
      "Участие в проектах",
    ],
    blocks: [...EXPERT_PUBLIC_BLOCKS],
  },
  organizations: {
    slug: "organizations",
    href: "/organization",
    eyebrow: "Для организаций",
    title: "Партнёрство, проекты и возможности компании",
    problem:
      "Команде сложно держать развитие бизнеса, поиск партнёров и сделки в одном контуре — всё разъезжается по чатам и таблицам.",
    solution:
      "ЦКР даёт организации профиль, проекты, партнёрства и связь с предпринимателями, экспертами и инвесторами. Ориентир — кейс ТИНДА.",
    advantages: [
      "Партнёрский кабинет",
      "Проекты развития компании",
      "Возможности и заявки экосистемы",
      "Кейс ТИНДА как production-контур",
    ],
    ctaPrimary: {
      label: "Зарегистрировать организацию",
      href: "/register?role=company",
    },
    ctaSecondary: {
      label: "Кейс ТИНДА",
      href: "/cases",
    },
    scenario: [
      "Регистрация",
      "Профиль организации",
      "Партнёрство",
      "Проекты и возможности",
    ],
    blocks: [...ORGANIZATION_PUBLIC_BLOCKS],
  },
};

export const howCkrWorks = [
  {
    step: "01",
    title: "Опишите ситуацию",
    text: "Начните с Лии: аудит бизнеса или идея проекта.",
  },
  {
    step: "02",
    title: "Соберите решение",
    text: "Найдите возможности, капитал и экспертов внутри ЦКР.",
  },
  {
    step: "03",
    title: "Реализуйте",
    text: "Ведите сделки, этапы и коммуникации в кабинете до результата.",
  },
] as const;
