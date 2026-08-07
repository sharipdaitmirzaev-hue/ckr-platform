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
  /** Кому подходит */
  audience: string;
  problem: string;
  solution: string;
  advantages: string[];
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  nextStep: { label: string; href: string };
  scenario?: string[];
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
    title: "От идеи и бизнеса до развития в ЦКР",
    audience:
      "Предпринимателям с действующим бизнесом или идеей, которым нужны анализ, ресурсы и партнёры.",
    problem:
      "Идея или бизнес есть, а единого контура для анализа, экспертов и партнёров нет — всё разъезжается по чатам и таблицам.",
    solution:
      "ЦКР проводит путь: задача → анализ Лии → проект → эксперты и партнёры → развитие. Первый шаг — аудит или сценарий «От идеи до проекта».",
    advantages: [
      "Аудит бизнеса и BusinessAuditReport",
      "Создание проекта за минуты",
      "Каталоги возможностей, экспертов и инвестиций",
      "Сопровождение до результата",
    ],
    ctaPrimary: {
      label: "Расскажите о вашей задаче",
      href: "/lia?scenario=business_audit",
    },
    ctaSecondary: {
      label: "Регистрация",
      href: "/register?role=entrepreneur",
    },
    nextStep: {
      label: "Пройти аудит и создать проект",
      href: "/register?next=/lia?scenario=business_audit",
    },
    scenario: [...ENTREPRENEUR_PUBLIC_PATH],
  },
  investors: {
    slug: "investors",
    href: "/investor",
    eyebrow: "Для инвесторов",
    title: "Проекты и интересы в прозрачном контуре",
    audience:
      "Инвесторам, которые ищут проекты и хотят фиксировать интерес без потери контекста.",
    problem:
      "Сложно найти проверенные проекты и не потерять переговоры между таблицами и мессенджерами.",
    solution:
      "ЦКР собирает проекты и возможности, позволяет отметить интерес и вести диалог в прозрачной среде.",
    advantages: [
      "Каталог проектов с фильтрами",
      "Возможности рядом с проектами",
      "Интересы и заявки в кабинете",
      "Статусы и верификация участников",
    ],
    ctaPrimary: {
      label: "Смотреть проекты",
      href: "/projects",
    },
    ctaSecondary: {
      label: "Регистрация инвестора",
      href: "/register?role=investor",
    },
    nextStep: {
      label: "Выбрать проект и отметить интерес",
      href: "/register?role=investor&next=/projects",
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
    title: "Компетенции рядом с реальными проектами",
    audience:
      "Экспертам, которые хотят получать запросы от проектов и строить репутацию.",
    problem:
      "Сложно найти проекты под вашу компетенцию и выстроить доверие без лишней рекламы.",
    solution:
      "ЦКР публикует профиль, связывает с проектами региона и позволяет принимать заявки на сопровождение.",
    advantages: [
      "Публичный профиль с верификацией",
      "Участие в проектах через заявки",
      "Репутация внутри экосистемы",
      "Сопровождение в workspace",
    ],
    ctaPrimary: {
      label: "Стать экспертом",
      href: "/register?role=expert",
    },
    ctaSecondary: {
      label: "Каталог экспертов",
      href: "/experts#catalog",
    },
    nextStep: {
      label: "Создать профиль эксперта",
      href: "/register?role=expert&next=/dashboard/expert",
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
    title: "Партнёрство и проекты компании",
    audience:
      "Организациям, которым нужен партнёрский контур и проекты развития.",
    problem:
      "Развитие бизнеса, партнёры и сделки живут в разных инструментах.",
    solution:
      "ЦКР даёт профиль организации, проекты, партнёрства и связь с экосистемой. Ориентир — кейс ТИНДА.",
    advantages: [
      "Партнёрский кабинет",
      "Проекты развития компании",
      "Возможности и заявки",
      "Кейс ТИНДА как production-контур",
    ],
    ctaPrimary: {
      label: "Стать партнёром",
      href: "/register?role=company",
    },
    ctaSecondary: {
      label: "Кейс ТИНДА",
      href: "/cases",
    },
    nextStep: {
      label: "Зарегистрировать организацию",
      href: "/register?role=company&next=/partner",
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
    title: "Опишите задачу",
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
    text: "Ведите сделки и этапы в кабинете до результата.",
  },
] as const;
