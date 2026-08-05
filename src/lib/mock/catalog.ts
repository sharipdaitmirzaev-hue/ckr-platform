import type { Opportunity, Project, Solution } from "@/types";

/** Плейсхолдеры для модулей без БД / демо. */
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
];

export const mockOpportunities: Opportunity[] = [
  {
    id: "opp-1",
    ownerId: "user-demo",
    type: "land",
    title: "Участок под производство",
    description:
      "Площадка с инженерной подготовкой для промышленного объекта. Подходит проектам на стадии запуска и расширения.",
    region: "Московская область",
    city: "Подольск",
    price: 45_000_000,
    currency: "RUB",
    status: "published",
  },
  {
    id: "opp-2",
    ownerId: "user-demo",
    type: "equipment",
    title: "Линия фасовки и упаковки",
    description:
      "Готовое оборудование для запуска или расширения производства пищевой продукции.",
    region: "Республика Татарстан",
    city: "Казань",
    price: null,
    currency: "RUB",
    status: "published",
  },
  {
    id: "opp-3",
    ownerId: "user-demo",
    type: "partner",
    title: "Отраслевой партнёр по дистрибуции",
    description:
      "Компания готова выступить партнёром по выводу продукта в розничные сети региона.",
    region: "Санкт-Петербург",
    city: "Санкт-Петербург",
    price: null,
    currency: "RUB",
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
];
