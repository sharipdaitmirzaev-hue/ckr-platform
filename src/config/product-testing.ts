export const PRODUCT_TEST_STATUSES = [
  "pending",
  "in_progress",
  "passed",
  "failed",
  "blocked",
] as const;

export type ProductTestStatus = (typeof PRODUCT_TEST_STATUSES)[number];

export const productTestStatusLabels: Record<ProductTestStatus, string> = {
  pending: "Не начат",
  in_progress: "В работе",
  passed: "Пройден",
  failed: "Провален",
  blocked: "Заблокирован",
};

export type ProductTestScenarioKey =
  | "entrepreneur"
  | "investor"
  | "opportunity_owner"
  | "expert"
  | "full_cycle";

export type ProductTestCheckItem = {
  id: string;
  label: string;
  done?: boolean;
  note?: string;
};

export type ProductTestScenario = {
  key: ProductTestScenarioKey;
  title: string;
  summary: string;
  flow: string[];
  checks: ProductTestCheckItem[];
};

export const PRODUCT_TEST_SCENARIOS: ProductTestScenario[] = [
  {
    key: "entrepreneur",
    title: "Предприниматель",
    summary: "От регистрации до публикации проекта через Лию.",
    flow: [
      "Регистрация",
      "Выбор роли",
      "Лия",
      "Создание проекта",
      "Публикация",
    ],
    checks: [
      { id: "e-reg", label: "Регистрация проходит без ошибок" },
      { id: "e-role", label: "Онбординг: роль и персональный путь понятны" },
      { id: "e-lia", label: "Лия помогает оформить идею" },
      { id: "e-create", label: "Проект создаётся и открывается в кабинете" },
      { id: "e-publish", label: "Публикация / модерация понятна" },
      { id: "e-ux", label: "UX и тексты не вызывают тупиков" },
    ],
  },
  {
    key: "investor",
    title: "Инвестор",
    summary: "От регистрации до отправки заявки на проект.",
    flow: [
      "Регистрация",
      "Каталог проектов",
      "Карточка проекта",
      "Отправка заявки",
    ],
    checks: [
      { id: "i-reg", label: "Регистрация и роль инвестора" },
      { id: "i-catalog", label: "Каталог проектов читаем и фильтруется" },
      { id: "i-card", label: "Карточка проекта даёт достаточно контекста" },
      { id: "i-app", label: "Заявка отправляется, владелец получает уведомление" },
    ],
  },
  {
    key: "opportunity_owner",
    title: "Владелец возможности",
    summary: "Создание возможности, публикация и входящая заявка.",
    flow: [
      "Создание возможности",
      "Публикация",
      "Получение заявки",
    ],
    checks: [
      { id: "o-create", label: "Форма создания возможности понятна" },
      { id: "o-publish", label: "Публикация / модерация работает" },
      { id: "o-app", label: "Входящая заявка видна в кабинете" },
    ],
  },
  {
    key: "expert",
    title: "Эксперт",
    summary: "Профиль эксперта, публикация и запрос на сопровождение.",
    flow: [
      "Создание профиля",
      "Публикация",
      "Получение запроса",
    ],
    checks: [
      { id: "x-create", label: "Профиль эксперта создаётся" },
      { id: "x-publish", label: "Публикация в каталоге" },
      { id: "x-request", label: "Заявка/запрос на экспертизу доходит" },
    ],
  },
  {
    key: "full_cycle",
    title: "Полный цикл ЦКР",
    summary: "Идея → проект → Лия → решения → инвестор → заявка → сделка → workspace.",
    flow: [
      "Идея",
      "Проект",
      "Анализ Лией",
      "Поиск решений",
      "Инвестор",
      "Заявка",
      "Сделка",
      "Workspace",
    ],
    checks: [
      { id: "f-idea", label: "Идея оформляется в проект" },
      { id: "f-analyze", label: "Анализ Лией даёт понятный отчёт" },
      { id: "f-solutions", label: "Поиск решений / совпадений работает" },
      { id: "f-investor", label: "Инвестор находит проект" },
      { id: "f-app", label: "Заявка связывает стороны" },
      { id: "f-deal", label: "Сделка создаётся в кабинете проекта" },
      { id: "f-workspace", label: "Workspace: этапы, участники, история" },
    ],
  },
];

export function getScenario(key: string): ProductTestScenario | undefined {
  return PRODUCT_TEST_SCENARIOS.find((item) => item.key === key);
}
