/**
 * Website Finalization & UX — этап 67.
 * Финальная структура публичного сайта и точки входа.
 */

/** Каноническая структура публичного сайта. */
export const WEBSITE_SITEMAP = [
  { href: "/", label: "Главная" },
  { href: "/about", label: "О ЦКР" },
  { href: "/services", label: "Услуги" },
  { href: "/lia", label: "Лия" },
  { href: "/projects", label: "Проекты" },
  { href: "/investments", label: "Инвестиции" },
  { href: "/opportunities", label: "Возможности" },
  { href: "/experts", label: "Эксперты" },
  { href: "/cases", label: "Кейсы" },
  { href: "/trust", label: "Доверие" },
  { href: "/contacts", label: "Контакты" },
  { href: "/entrepreneur", label: "Предпринимателям" },
  { href: "/investor", label: "Инвесторам" },
  { href: "/expert", label: "Экспертам" },
  { href: "/organization", label: "Организациям" },
] as const;

/** Главный путь посетителя: понять ЦКР → выбрать задачу. */
export const HOME_INTENT_CTAS = [
  {
    label: "У меня есть бизнес",
    href: "/lia?scenario=business_audit&message=" + encodeURIComponent("У меня есть бизнес"),
    hint: "Аудит → рекомендации → проект",
  },
  {
    label: "У меня есть идея",
    href: "/lia?scenario=business_idea&message=" + encodeURIComponent("У меня есть идея"),
    hint: "Идея → анализ → карточка проекта",
  },
  {
    label: "Мне нужны ресурсы",
    href: "/opportunities",
    hint: "Возможности, эксперты, инвестиции",
  },
  {
    label: "Я хочу стать партнёром",
    href: "/organization",
    hint: "Организация → партнёрство → проекты",
  },
] as const;

/** Единый путь регистрации без тупиков. */
export const USER_JOURNEY_STEPS = [
  "Посетитель",
  "Регистрация",
  "Выбор роли",
  "Создание профиля",
  "Первое действие",
] as const;

export const TRUST_VERIFICATION = {
  title: "Как проверяются проекты",
  items: [
    "Публикация проходит модерацию перед попаданием в каталог",
    "Статусы проекта и верификации видны участникам",
    "Документы и чувствительные данные — по правам доступа",
    "Репутация экспертов и организаций учитывается в экосистеме",
  ],
} as const;

export const TRUST_INTERACTION = {
  title: "Принципы взаимодействия",
  items: [
    "Лия рекомендует, но не действует без подтверждения",
    "Заявки и интересы фиксируются в контуре ЦКР",
    "Стороны видят статусы сделки и этапы workspace",
    "ЦКР не заменяет юридическую или финансовую консультацию",
  ],
} as const;

/** Следующие шаги для страниц без тупиков. */
export const PAGE_NEXT_STEPS: Record<
  string,
  { title: string; primary: { label: string; href: string }; secondary?: { label: string; href: string } }
> = {
  home: {
    title: "Выберите задачу",
    primary: { label: "Расскажите о вашей задаче", href: "/lia?scenario=business_audit" },
    secondary: { label: "Регистрация", href: "/register" },
  },
  about: {
    title: "Что сделать дальше",
    primary: { label: "Получить аудит", href: "/lia?scenario=business_audit" },
    secondary: { label: "Смотреть услуги", href: "/services" },
  },
  services: {
    title: "Что сделать дальше",
    primary: { label: "Начать с аудита", href: "/lia?scenario=business_audit" },
    secondary: { label: "Связаться", href: "/contacts" },
  },
  cases: {
    title: "Что сделать дальше",
    primary: { label: "Пройти похожий путь", href: "/lia?scenario=business_audit" },
    secondary: { label: "Для организаций", href: "/organization" },
  },
  trust: {
    title: "Что сделать дальше",
    primary: { label: "Регистрация", href: "/register" },
    secondary: { label: "Как работает Лия", href: "/lia" },
  },
  contacts: {
    title: "Что сделать дальше",
    primary: { label: "Расскажите о вашей задаче", href: "/lia?scenario=business_audit" },
    secondary: { label: "Регистрация", href: "/register" },
  },
  projects: {
    title: "Что сделать дальше",
    primary: { label: "Разместить проект", href: "/register?next=/dashboard/projects/create" },
    secondary: { label: "Аудит с Лией", href: "/lia?scenario=business_audit" },
  },
  investments: {
    title: "Что сделать дальше",
    primary: { label: "Смотреть проекты", href: "/projects" },
    secondary: { label: "Регистрация инвестора", href: "/register?role=investor" },
  },
  opportunities: {
    title: "Что сделать дальше",
    primary: { label: "Начать с аудита", href: "/lia?scenario=business_audit" },
    secondary: { label: "Предложить возможность", href: "/register?next=/dashboard/opportunities/create" },
  },
  experts: {
    title: "Что сделать дальше",
    primary: { label: "Стать экспертом", href: "/register?role=expert" },
    secondary: { label: "Смотреть проекты", href: "/projects" },
  },
  lia: {
    title: "Что сделать дальше",
    primary: {
      label: "Расскажите о вашей задаче",
      href: "/lia?scenario=business_audit",
    },
    secondary: { label: "Регистрация", href: "/register?next=/lia" },
  },
};
