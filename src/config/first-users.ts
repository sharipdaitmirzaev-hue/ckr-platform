/** Подготовка к первым реальным пользователям (этап 49). */

export const TRUST_PAGE = {
  whatIsCkr: {
    goal:
      "ЦКР — цифровая платформа, где идеи, бизнес и ресурсы находят друг друга в одной экосистеме.",
    problem:
      "Предприниматели, инвесторы, эксперты и организации ищут друг друга по частям: в чатах, объявлениях и разрозненных сервисах. Теряются контекст, доверие и скорость сделки.",
    audience:
      "Платформа создана для предпринимателей, инвесторов, экспертов и организаций, которым нужен прозрачный путь от идеи до реализации.",
  },
  principles: [
    {
      title: "Прозрачность",
      text: "Статусы проектов, заявок и сделок видны участникам процесса. Лия рекомендует, но не действует скрыто.",
    },
    {
      title: "Проверка участников",
      text: "Публикация проходит модерацию. Эксперты и профили могут проходить верификацию.",
    },
    {
      title: "Защита данных",
      text: "Личные данные не выставляются в демо-каталоге. Контакты и документы контролируются настройками профиля и правами доступа.",
    },
    {
      title: "Ответственность сторон",
      text: "ЦКР предоставляет контур взаимодействия. Решения по сделкам принимают участники; рекомендации Лии не являются юридической или финансовой консультацией.",
    },
  ],
  journey: [
    "Идея",
    "Анализ Лии",
    "Проект",
    "Ресурсы",
    "Реализация",
  ] as const,
} as const;

export const TINDA_CASE_DETAIL = {
  title: "Кейс ТИНДА",
  eyebrow: "Первый production case",
  task: "Развитие оптового направления ООО ТИНДА — упаковать действующий бизнес как проект развития и связать организацию, этапы, партнёров и сделки.",
  before: {
    idea: "Развитие оптовой B2B-платформы закупок и поставок в регионе.",
    resources: "Действующая организация, команда, понимание рынка.",
    limits:
      "Нет единого контура: идея, анализ, roadmap, партнёры и сделки жили в разных инструментах.",
  },
  ckrDid: [
    "Анализ Лии — ресурсы, gaps, рекомендации следующего шага",
    "Стратегия развития проекта на платформе",
    "Roadmap: подготовка → продажи → масштабирование",
    "Поиск решений через каталоги и заявки экосистемы",
  ],
  result: {
    stage:
      "Проект ведётся как production pilot case: организация, workspace, CRM/партнёры, пилотная сделка.",
    nextSteps: [
      "Закрыть экспертные и партнёрские потребности через экосистему Wave 2",
      "Довести ключевые связи до измеримого результата",
      "Использовать выводы Matching Analysis в Decision Gate",
    ],
  },
} as const;

/** Подсказки после регистрации: «Что хотите сделать?» */
export const FIRST_INTENT_PROMPTS = [
  {
    id: "idea",
    label: "У меня есть идея",
    href:
      "/lia?scenario=business_idea&message=" +
      encodeURIComponent("У меня есть идея"),
  },
  {
    id: "solution",
    label: "Ищу решение",
    href:
      "/lia?scenario=solution&message=" +
      encodeURIComponent("Ищу решение для проекта"),
  },
  {
    id: "partners",
    label: "Нужны партнёры",
    href:
      "/lia?scenario=find_expert&message=" +
      encodeURIComponent("Нужны партнёры и эксперты"),
  },
  {
    id: "invest",
    label: "Хочу инвестировать",
    href: "/projects",
  },
  {
    id: "expert",
    label: "Хочу предложить экспертизу",
    href: "/dashboard/expert",
  },
] as const;

/** Первый путь пользователя по ролям. */
export const FIRST_USER_PATHS = {
  entrepreneur: {
    label: "Предприниматель",
    action: "Создать проект",
    href: "/lia?scenario=business_idea",
  },
  investor: {
    label: "Инвестор",
    action: "Найти проект",
    href: "/projects",
  },
  expert: {
    label: "Эксперт",
    action: "Создать профиль",
    href: "/dashboard/expert",
  },
  organization: {
    label: "Организация",
    action: "Создать профиль",
    href: "/partner",
  },
} as const;

export const FIRST_USER_JOURNEY = [
  "Главная",
  "Регистрация",
  "Выбор роли",
  "Онбординг",
  "Первое действие",
] as const;

/** Префиксы UUID демо-каталога (без реальных ПДн). */
export const DEMO_ENTITY_ID_PREFIXES = [
  "a1000001-", // projects
  "a2000001-", // opportunities
  "a3000001-", // investments
  "a4000001-", // experts
] as const;

export function isDemoEntityId(id: string | null | undefined): boolean {
  if (!id) return false;
  return DEMO_ENTITY_ID_PREFIXES.some((prefix) => id.startsWith(prefix));
}
