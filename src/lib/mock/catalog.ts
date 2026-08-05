import type { Opportunity, Project, Solution } from "@/types";

/** Плейсхолдеры для модулей без БД (возможности/решения). */
export const mockProjects: Project[] = [
  {
    id: "proj-1",
    ownerId: "user-demo",
    title: "Производственная линия в регионе",
    slug: "proizvodstvennaya-liniya",
    summary: "Масштабирование производства с поиском инвестора и площадки.",
    description:
      "Действующее производство готовит расширение линии. Требуются инвестиции и партнёр по площадке.",
    category: "production",
    region: "Центральный ФО",
    investmentRequired: 25_000_000,
    currency: "RUB",
    stage: "operating",
    status: "published",
  },
  {
    id: "proj-2",
    ownerId: "user-demo",
    title: "Цифровой сервис для B2B",
    slug: "cifrovoy-servis-b2b",
    summary: "Продукт на стадии стартапа, требуется капитал на выход в новые отрасли.",
    description:
      "B2B-сервис с работающим MVP. Команда ищет инвестора для масштабирования продаж.",
    category: "it",
    region: "Москва",
    investmentRequired: 8_000_000,
    currency: "RUB",
    stage: "startup",
    status: "published",
  },
  {
    id: "proj-3",
    ownerId: "user-demo",
    title: "Агропроект с переработкой",
    slug: "agroproekt-pererabotka",
    summary: "Поиск земли, оборудования и отраслевых партнёров.",
    description:
      "Идея агропроекта с переработкой сырья. Нужны земельный участок и технологическое оборудование.",
    category: "agriculture",
    region: "Южный ФО",
    investmentRequired: 40_000_000,
    currency: "RUB",
    stage: "idea",
    status: "published",
  },
];

export const mockOpportunities: Opportunity[] = [
  {
    id: "opp-1",
    ownerId: "user-demo",
    type: "land",
    title: "Участок под производство",
    summary: "Площадка с инженерной подготовкой для промышленного объекта.",
    region: "МО",
    status: "published",
  },
  {
    id: "opp-2",
    ownerId: "user-demo",
    type: "equipment",
    title: "Линия фасовки и упаковки",
    summary: "Готовое оборудование для запуска или расширения производства.",
    region: "Казань",
    status: "published",
  },
  {
    id: "opp-3",
    ownerId: "user-demo",
    type: "ready_business",
    title: "Сервисный бизнес с клиентской базой",
    summary: "Действующий бизнес, открытый к партнёрству или передаче.",
    region: "Санкт-Петербург",
    status: "published",
  },
];

export const mockSolutions: Solution[] = [
  {
    id: "sol-1",
    ownerId: "user-demo",
    title: "Привлечение инвестора под производство",
    summary: "Комплексный запрос: капитал, юридическое сопровождение сделки.",
    types: ["find_investor", "legal_support"],
    status: "published",
  },
  {
    id: "sol-2",
    ownerId: "user-demo",
    title: "Площадка и оборудование под запуск",
    summary: "Подбор земли и производственной линии в одном решении.",
    types: ["find_land", "find_equipment"],
    status: "published",
  },
  {
    id: "sol-3",
    ownerId: "user-demo",
    title: "Команда и продвижение проекта",
    summary: "Поиск специалистов и маркетинговое сопровождение выхода.",
    types: ["find_specialists", "marketing"],
    status: "published",
  },
  {
    id: "sol-4",
    ownerId: "user-demo",
    title: "Юридическое сопровождение",
    summary: "Структурирование партнёрств, договоров и сделок.",
    types: ["legal_support"],
    status: "published",
  },
  {
    id: "sol-5",
    ownerId: "user-demo",
    title: "Поиск оборудования",
    summary: "Подбор техники и линий под задачу проекта.",
    types: ["find_equipment"],
    status: "published",
  },
  {
    id: "sol-6",
    ownerId: "user-demo",
    title: "Маркетинг проекта",
    summary: "Позиционирование, упаковка предложения и выход к аудитории.",
    types: ["marketing"],
    status: "published",
  },
];
