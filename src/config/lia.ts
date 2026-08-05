import type { LiaScenarioId } from "@/types/lia";

export const LIA_DISCLAIMER =
  "Ответ Лии — предварительная рекомендация ЦКР, не юридическая и не финансовая консультация.";

export const LIA_MAX_MESSAGE_LENGTH = 2000;
export const LIA_RATE_LIMIT_WINDOW_MS = 60_000;
export const LIA_RATE_LIMIT_MAX = 20;

export const LIA_SCENARIOS: {
  id: LiaScenarioId;
  label: string;
  prompt: string;
  description: string;
}[] = [
  {
    id: "business_idea",
    label: "Помоги создать бизнес-проект",
    prompt: "Помоги создать бизнес-проект",
    description: "Сценарий «От идеи до проекта»",
  },
  {
    id: "find_investments",
    label: "Найди подходящие инвестиционные предложения",
    prompt: "Найди подходящие инвестиционные предложения",
    description: "Подбор по каталогу инвестиций",
  },
  {
    id: "find_property",
    label: "Найди землю или помещение",
    prompt: "Найди землю или помещение",
    description: "Возможности: земля и помещения",
  },
  {
    id: "find_expert",
    label: "Подбери эксперта",
    prompt: "Подбери эксперта",
    description: "Каталог экспертов ЦКР",
  },
  {
    id: "solution",
    label: "Собери комплексное решение",
    prompt: "Собери комплексное решение",
    description: "Сборка: проекты, ресурсы, капитал, эксперты + ориентиры",
  },
  {
    id: "realize_project",
    label: "Помоги реализовать проект",
    prompt: "Помоги реализовать проект",
    description: "Сопровождение: этапы, следующий шаг, эксперт и партнёр",
  },
  {
    id: "org_find_projects",
    label: "Найди подходящие проекты для нашей организации",
    prompt: "Найди подходящие проекты для нашей организации",
    description: "Партнёрская сеть: подбор проектов под организацию",
  },
  {
    id: "org_offer_opportunities",
    label: "Какие возможности мы можем предложить",
    prompt: "Какие возможности мы можем предложить",
    description: "Партнёрская сеть: идеи предложений организации",
  },
  {
    id: "check_reliability",
    label: "Проверь надёжность участника",
    prompt: "Проверь надёжность участника",
    description: "Факты, документы и история — без окончательного вердикта",
  },
];

export const LIA_SECURITY_NOTES = [
  "Лия только рекомендует — не создаёт заявки автоматически.",
  "Данные проекта не изменяются без подтверждения пользователя.",
  "Внешние источники помечаются отдельно и не доверяются автоматически.",
  "Приватные документы пользователей не отправляются во внешние модели.",
] as const;

/** Порядок вопросов сценария «От идеи до проекта». */
export const BUSINESS_IDEA_STEPS = [
  {
    key: "title",
    question: "Как называется ваша идея или проект?",
  },
  {
    key: "category",
    question:
      "В какой отрасли проект? Например: производство, недвижимость, IT, сельское хозяйство, туризм.",
  },
  {
    key: "region",
    question: "В каком регионе планируете реализацию?",
  },
  {
    key: "description",
    question: "Кратко опишите суть проекта и желаемый результат.",
  },
  {
    key: "assets",
    question: "Что уже есть: команда, активы, клиенты, прототип?",
  },
  {
    key: "needs",
    question: "Что требуется: земля, оборудование, партнёр, экспертиза?",
  },
  {
    key: "investment",
    question: "Какая сумма инвестиций нужна? Укажите число в рублях.",
  },
  {
    key: "stage",
    question:
      "На какой стадии проект: idea (идея), startup, operating или expansion?",
  },
] as const;

export const PROJECT_FLOW_START_PATTERN =
  /помоги создать бизнес-проект|помоги оформить бизнес-идею|создать бизнес-проект/i;

export const REALIZE_PROJECT_PATTERN =
  /помоги реализовать проект|сопровождени|реализац(ия|ии) проекта|следующий шаг проекта/i;

export const CHECK_RELIABILITY_PATTERN =
  /провер(ь|ить|ьте)?\s+над[её]жност|над[её]жност(ь|и)\s+участник|check.?reliab/i;
