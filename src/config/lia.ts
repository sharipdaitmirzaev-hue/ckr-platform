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
  {
    id: "business_audit",
    label: "Аудит бизнеса",
    prompt: "Аудит бизнеса",
    description: "Диагностика действующего бизнеса → SWOT и следующие шаги",
  },
  {
    id: "develop_strategy",
    label: "Разработать стратегию развития",
    prompt: "Разработать стратегию развития",
    description: "Цели, направления роста, ресурсы, риски, план действий",
  },
  {
    id: "check_progress",
    label: "Проверь прогресс проекта",
    prompt: "Проверь прогресс проекта",
    description:
      "Анализ roadmap, задач, KPI и активности → ProgressReport (без изменений данных)",
  },
  {
    id: "evaluate_outcome",
    label: "Оцени результат проекта",
    prompt: "Оцени результат проекта",
    description:
      "KPI, roadmap, project_results, финансы → OutcomeReport (только анализ)",
  },
  {
    id: "pilot_insight",
    label: "Что мешает проекту двигаться?",
    prompt: "Что мешает проекту двигаться?",
    description:
      "Пилот: активность, roadmap, задачи, KPI, сделки → PilotInsightReport (только анализ)",
  },
  {
    id: "product_improvement",
    label: "Что улучшить в ЦКР?",
    prompt: "Что улучшить в ЦКР?",
    description:
      "Feedback, issues, метрики пилота → ProductImprovementReport (только анализ)",
  },
  {
    id: "beta_analysis",
    label: "Как проходит запуск ЦКР?",
    prompt: "Как проходит запуск ЦКР?",
    description:
      "Controlled beta: активация, блокеры, неиспользуемые модули → BetaAnalysisReport",
  },
  {
    id: "beta_review",
    label: "Сделай обзор закрытой beta",
    prompt: "Сделай обзор закрытой beta",
    description:
      "Воронка, потоки, unused features, ценность → BetaReviewReport (только данные)",
  },
  {
    id: "launch_readiness",
    label: "Что нужно исправить перед запуском?",
    prompt: "Что нужно исправить перед запуском?",
    description:
      "Critical issues, действия, риски launch → LaunchReadinessReport (только анализ)",
  },
  {
    id: "launch_guide",
    label: "Как начать работу с ЦКР?",
    prompt: "Как начать работу с ЦКР?",
    description:
      "Какую роль выбрать и что сделать первым шагом → LaunchGuide",
  },
  {
    id: "launch_status",
    label: "Как проходит запуск?",
    prompt: "Как проходит запуск?",
    description:
      "Активность волны, блокеры, рекомендации → LaunchStatusReport (только анализ)",
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

export const BUSINESS_AUDIT_START_PATTERN =
  /аудит\s+бизнеса|проведи\s+аудит|business\s*audit|диагностик[аи]\s+бизнеса/i;

export const DEVELOP_STRATEGY_START_PATTERN =
  /разработать\s+стратегию|стратегия\s+развития|develop\s+strategy|построй\s+стратегию/i;

export const CHECK_PROGRESS_START_PATTERN =
  /проверь\s+прогресс|проверка\s+прогресса|прогресс\s+проекта|check\s+progress|как\s+ид[её]т\s+реализац/i;

export const EVALUATE_OUTCOME_START_PATTERN =
  /оцени\s+результат|оценка\s+результата|результат\s+проекта|evaluate\s+outcome|итог\s+проекта/i;

export const PILOT_INSIGHT_START_PATTERN =
  /что\s+мешает\s+проекту|мешает\s+двигаться|pilot\s*insight|блокир(ует|уют)\s+проект/i;

export const PRODUCT_IMPROVEMENT_START_PATTERN =
  /что\s+улучшить\s+в\s+цкр|улучш(ить|ения)\s+(в\s+)?цкр|product\s*improvement|цикл\s+улучшен/i;

export const BETA_ANALYSIS_START_PATTERN =
  /как\s+проходит\s+запуск\s+цкр|запуск\s+цкр|beta\s*analysis|controlled\s*beta|как\s+ид[её]т\s+beta/i;

export const BETA_REVIEW_START_PATTERN =
  /обзор\s+закрытой\s+beta|обзор\s+beta|beta\s*review|анализ\s+beta/i;

export const LAUNCH_READINESS_START_PATTERN =
  /что\s+нужно\s+исправить\s+перед\s+запуском|исправить\s+перед\s+запуском|launch\s*readiness|готовность\s+к\s+запуску/i;

export const LAUNCH_GUIDE_START_PATTERN =
  /как\s+начать\s+работу\s+с\s+цкр|как\s+начать\s+с\s+цкр|начать\s+работу\s+с\s+цкр|launch\s*guide/i;

export const LAUNCH_STATUS_START_PATTERN =
  /как\s+проходит\s+запуск(?!\s+цкр)|launch\s*status|статус\s+запуска|статус\s+волн/i;

/** Вопросы сценария «Аудит бизнеса» (пилот ТИНДА). */
export const BUSINESS_AUDIT_STEPS = [
  {
    key: "industry",
    question:
      "В какой отрасли работает бизнес? Например: торговля, производство, IT, услуги.",
  },
  {
    key: "region",
    question: "В каком регионе сейчас работаете?",
  },
  {
    key: "stage",
    question:
      "Какая текущая стадия: idea, startup, operating или expansion?",
  },
  {
    key: "resources",
    question:
      "Какие ресурсы уже есть: клиенты, команда, склад, продукт, капитал?",
  },
  {
    key: "team",
    question: "Как устроена команда? Кто отвечает за продажи, закупки, операции?",
  },
  {
    key: "problems",
    question: "Какие главные проблемы и ограничения роста?",
  },
  {
    key: "goals",
    question: "Какие цели на ближайшие 6–12 месяцев?",
  },
] as const;

/** Вопросы сценария «Разработать стратегию развития». */
export const DEVELOP_STRATEGY_STEPS = [
  {
    key: "project",
    question:
      "Как называется проект или бизнес, для которого нужна стратегия?",
  },
  {
    key: "audit",
    question:
      "Кратко: итог аудита — сильные стороны и главные проблемы (можно своими словами).",
  },
  {
    key: "goals",
    question: "Какие стратегические цели на 6–12 месяцев?",
  },
  {
    key: "resources",
    question: "Какие ресурсы уже есть и какие нужно найти?",
  },
  {
    key: "constraints",
    question: "Какие ограничения: бюджет, регион, команда, сроки?",
  },
] as const;
