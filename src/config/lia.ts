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
    id: "product_fix_review",
    label: "Что улучшилось после исправлений?",
    prompt: "Что улучшилось после исправлений?",
    description:
      "Product Fix Sprint: completed / improved / remaining → ProductFixImprovementReport (только анализ)",
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
  {
    id: "launch_goals",
    label: "Достигнуты ли цели запуска?",
    prompt: "Достигнуты ли цели запуска?",
    description:
      "Цели волны: achieved / failed, риски, next actions → LaunchGoalReport (только анализ)",
  },
  {
    id: "closed_wave",
    label: "Проанализируй первую волну ЦКР",
    prompt: "Проанализируй первую волну ЦКР",
    description:
      "Closed Wave 1 — ТИНДА: цели, UX, бизнес-результаты → ClosedWaveReport (только анализ)",
  },
  {
    id: "wave_review",
    label: "Проанализируй результаты первой волны",
    prompt: "Проанализируй результаты первой волны",
    description:
      "Success factors, problems, patterns → WaveReviewReport (только анализ)",
  },
  {
    id: "launch_decision",
    label: "Готов ли ЦКР к следующей волне?",
    prompt: "Готов ли ЦКР к следующей волне?",
    description:
      "Decision Gate: strengths / weaknesses / risks → LaunchDecisionAIReport (только анализ)",
  },
  {
    id: "ecosystem",
    label: "Как развивается экосистема ЦКР?",
    prompt: "Как развивается экосистема ЦКР?",
    description:
      "Wave 2: пользователи, проекты, эксперты, инвестиции, связи → EcosystemReport (только анализ)",
  },
  {
    id: "ecosystem_value",
    label: "Какая польза от экосистемы ЦКР?",
    prompt: "Какая польза от экосистемы ЦКР?",
    description:
      "Ценность связей и MatchQualityScore → EcosystemValueReport (только анализ)",
  },
  {
    id: "first_users",
    label: "Как прошёл первый запуск ЦКР?",
    prompt: "Как прошёл первый запуск ЦКР?",
    description:
      "First Users Wave: активация, поведение, проблемы, успехи → FirstUsersReport (только анализ)",
  },
  {
    id: "first_users_review",
    label: "Что показал первый запуск ЦКР?",
    prompt: "Что показал первый запуск ЦКР?",
    description:
      "First Users Review: активация, поведение, успехи, проблемы → FirstUsersReviewReport (только анализ)",
  },
  {
    id: "beta_expansion",
    label: "Как проходит расширенная beta?",
    prompt: "Как проходит расширенная beta?",
    description:
      "Beta Expansion Wave: активация, роли, Лия, экосистема → BetaExpansionReport (только анализ)",
  },
  {
    id: "open_beta_readiness",
    label: "Готов ли ЦКР к открытому запуску?",
    prompt: "Готов ли ЦКР к открытому запуску?",
    description:
      "Open Beta Readiness: product / users / ecosystem → OpenBetaReadinessReport (только анализ)",
  },
  {
    id: "open_beta",
    label: "Как проходит открытый запуск ЦКР?",
    prompt: "Как проходит открытый запуск ЦКР?",
    description:
      "Open Beta Wave 1: пользователи, активация, Лия, экосистема → OpenBetaReport (только анализ)",
  },
  {
    id: "open_beta_growth",
    label: "Почему пользователи возвращаются в ЦКР?",
    prompt: "Почему пользователи возвращаются в ЦКР?",
    description:
      "Open Beta Growth: удержание, ценные действия, роли → RetentionReport (только анализ)",
  },
  {
    id: "public_launch_decision",
    label: "Готов ли ЦКР к публичному запуску?",
    prompt: "Готов ли ЦКР к публичному запуску?",
    description:
      "Public Launch Decision Gate: product / users / ecosystem / business / risks → PublicLaunchDecisionReport (только анализ)",
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

export const PRODUCT_FIX_REVIEW_START_PATTERN =
  /что\s+улучшилось\s+после\s+исправлен|улучшилось\s+после\s+исправлен|product\s*fix(\s*sprint)?|после\s+исправлений/i;

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

export const LAUNCH_GOALS_START_PATTERN =
  /достигнуты\s+ли\s+цели\s+запуска|цели\s+запуска|launch\s*goals|goal\s*report/i;

export const CLOSED_WAVE_START_PATTERN =
  /проанализируй\s+первую\s+волну(?!\s+цкр)?|анализ\s+первой\s+волны|closed\s*wave|первая\s+волна\s+цкр/i;

export const WAVE_REVIEW_START_PATTERN =
  /проанализируй\s+результаты\s+первой\s+волны|результаты\s+первой\s+волны|wave\s*review|обзор\s+волны/i;

export const LAUNCH_DECISION_START_PATTERN =
  /готов\s+ли\s+цкр\s+к\s+следующей\s+волне|следующей\s+волне|launch\s*decision|decision\s*gate/i;

export const ECOSYSTEM_VALUE_START_PATTERN =
  /какая\s+польза\s+от\s+экосистемы\s+цкр|польза\s+от\s+экосистемы|ценность\s+экосистемы|ecosystem\s*value|match\s*quality/i;

export const ECOSYSTEM_START_PATTERN =
  /как\s+развивается\s+экосистема\s+цкр|развитие\s+экосистемы|экосистема\s+цкр|ecosystem\s*report|ecosystem\s*beta/i;

export const FIRST_USERS_START_PATTERN =
  /как\s+прош[её]л\s+первый\s+запуск\s+цкр|первый\s+запуск\s+цкр|first\s*users(\s*wave)?|first\s*users\s*report/i;

export const FIRST_USERS_REVIEW_START_PATTERN =
  /что\s+показал\s+первый\s+запуск\s+цкр|показал\s+первый\s+запуск|first\s*users\s*review|обзор\s+первого\s+запуска/i;

export const BETA_EXPANSION_START_PATTERN =
  /как\s+проходит\s+расширенн(ая|ой)\s+beta|расширенн(ая|ой)\s+beta|beta\s*expansion(\s*wave)?|beta\s*expansion\s*report/i;

export const OPEN_BETA_READINESS_START_PATTERN =
  /готов\s+ли\s+цкр\s+к\s+открытому\s+запуску|открытому\s+запуску|open\s*beta\s*readiness|готовность\s+к\s+open\s*beta/i;

export const OPEN_BETA_GROWTH_START_PATTERN =
  /почему\s+пользователи\s+возвращаются(\s+в\s+цкр)?|удержание\s+(пользователей\s+)?open\s*beta|open\s*beta\s*growth|retention\s*report|возврат\s+пользователей/i;

export const PUBLIC_LAUNCH_DECISION_START_PATTERN =
  /готов\s+ли\s+цкр\s+к\s+публичному\s+запуску|публичному\s+запуску|public\s*launch\s*decision|public\s*launch\s*readiness|decision\s*gate\s*public/i;

export const OPEN_BETA_START_PATTERN =
  /как\s+проходит\s+открытый\s+запуск\s+цкр|открытый\s+запуск\s+цкр|open\s*beta(\s*wave)?(\s*report)?(?!\s*readiness)(?!\s*growth)/i;

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
