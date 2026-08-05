/**
 * Безопасные demo-данные ЦКР.
 * Вымышленные компании и роли — без реальных персональных данных.
 * ID — фиксированные UUID для идемпотентного seed.
 */

export const DEMO_OWNER_ID = "a0000001-0000-4000-8000-000000000001";

export const demoSeedMeta = {
  version: 2,
  note: "Демонстрационные и beta-данные ЦКР. Не содержат реальных ПДн.",
  categories: {
    projects: [
      "production",
      "real-estate",
      "agriculture",
      "tourism",
      "it",
      "trade",
      "services",
      "energy",
    ],
    opportunities: [
      "land",
      "premises",
      "equipment",
      "ready_business",
      "technology",
      "service",
      "partner",
    ],
    investments: ["equity", "loan", "partnership", "purchase"],
    experts: ["lawyer", "accountant", "marketer", "engineer"],
  },
} as const;

export const demoProjectsSeed = [
  {
    id: "a1000001-0000-4000-8000-000000000001",
    slug: "gostinichnyy-kompleks-u-morya",
    title: "Гостиничный комплекс у моря",
    summary:
      "Бутик-отель на черноморском побережье: 48 номеров, ресторан и wellness-зона.",
    description:
      "Проект предусматривает строительство и запуск гостиничного комплекса. Есть земельный участок и концепция. Требуются инвестиции на строительство, оснащение и запуск продаж.",
    category: "tourism",
    categoryName: "Туризм",
    region: "Краснодарский край",
    investmentRequired: 120_000_000,
    currency: "RUB",
    stage: "startup" as const,
  },
  {
    id: "a1000001-0000-4000-8000-000000000002",
    slug: "proizvodstvo-pitevoy-vody",
    title: "Производство питьевой воды",
    summary:
      "Линия розлива питьевой воды мощностью до 12 тыс. бутылок в смену.",
    description:
      "Действующий источник и разрешения. Нужны оборудование фасовки, склад и партнёр по дистрибуции в регионе.",
    category: "production",
    categoryName: "Производство",
    region: "Ставропольский край",
    investmentRequired: 35_000_000,
    currency: "RUB",
    stage: "operating" as const,
  },
  {
    id: "a1000001-0000-4000-8000-000000000003",
    slug: "agropromyshlennyy-proekt",
    title: "Агропромышленный проект",
    summary:
      "Тепличный комплекс и переработка овощей с выходом в федеральные сети.",
    description:
      "Участок подобран, агротехнология описана. Требуются капитал на теплицы, логистику и сертификацию продукции.",
    category: "agriculture",
    categoryName: "Сельское хозяйство",
    region: "Ростовская область",
    investmentRequired: 80_000_000,
    currency: "RUB",
    stage: "idea" as const,
  },
  {
    id: "a1000001-0000-4000-8000-000000000004",
    slug: "it-platforma-dlya-b2b",
    title: "IT-проект: B2B-платформа",
    summary:
      "SaaS для управления поставками малого и среднего бизнеса в регионах.",
    description:
      "Есть MVP и первые пилотные клиенты. Нужны инвестиции на продукт, продажи и интеграции.",
    category: "it",
    categoryName: "IT",
    region: "Москва",
    investmentRequired: 18_000_000,
    currency: "RUB",
    stage: "startup" as const,
  },
  {
    id: "a1000001-0000-4000-8000-000000000005",
    slug: "energeticheskiy-kompleks",
    title: "Локальная энергоустановка",
    summary:
      "Мини-ТЭС для промышленной площадки с возможностью продажи избытка мощности.",
    description:
      "Вымышленный beta-кейс: есть ТЭО и площадка. Нужны партнёры по оборудованию и капитал на монтаж.",
    category: "energy",
    categoryName: "Энергетика",
    region: "Свердловская область",
    investmentRequired: 95_000_000,
    currency: "RUB",
    stage: "startup" as const,
  },
] as const;

export const demoOpportunitiesSeed = [
  {
    id: "a2000001-0000-4000-8000-000000000001",
    type: "land" as const,
    typeName: "Земельный участок",
    title: "Земельный участок под производство",
    description:
      "Площадка 2,4 га с подъездом и возможностью подключения инженерных сетей. Подходит производственным и складским проектам.",
    region: "Московская область",
    city: "Домодедово",
    price: 42_000_000,
    currency: "RUB",
  },
  {
    id: "a2000001-0000-4000-8000-000000000002",
    type: "premises" as const,
    typeName: "Помещение",
    title: "Производственно-складское помещение",
    description:
      "Аренда или продажа корпуса 1 800 м² с кран-балкой и офисным блоком.",
    region: "Республика Татарстан",
    city: "Казань",
    price: 28_000_000,
    currency: "RUB",
  },
  {
    id: "a2000001-0000-4000-8000-000000000003",
    type: "equipment" as const,
    typeName: "Оборудование",
    title: "Линия розлива и упаковки",
    description:
      "Оборудование для розлива воды и напитков. Можно интегрировать в действующее производство.",
    region: "Ставропольский край",
    city: "Ставрополь",
    price: 9_500_000,
    currency: "RUB",
  },
  {
    id: "a2000001-0000-4000-8000-000000000004",
    type: "ready_business" as const,
    typeName: "Готовый бизнес",
    title: "Готовый бизнес: мини-отель",
    description:
      "Действующий мини-отель на 16 номеров с загрузкой в высокий сезон. Передача с персоналом и бронированиями.",
    region: "Краснодарский край",
    city: "Анапа",
    price: 55_000_000,
    currency: "RUB",
  },
] as const;

export const demoInvestmentsSeed = [
  {
    id: "a3000001-0000-4000-8000-000000000001",
    title: "Инвестиционное предложение 10 млн ₽",
    description:
      "Готовы рассмотреть проекты на ранней и средней стадии в IT, производстве и услугах. Участие — equity или партнёрство.",
    amountMin: 5_000_000,
    amountMax: 10_000_000,
    currency: "RUB",
    regions: ["Москва", "Центральный ФО"],
    categories: ["it", "production", "services"],
    investmentType: "equity" as const,
  },
  {
    id: "a3000001-0000-4000-8000-000000000002",
    title: "Инвестиционное предложение 50 млн ₽",
    description:
      "Капитал под проекты недвижимости, туризма и агро. Интересует прозрачная экономика и сопровождение сделки.",
    amountMin: 20_000_000,
    amountMax: 50_000_000,
    currency: "RUB",
    regions: ["Краснодарский край", "Ростовская область", "Южный ФО"],
    categories: ["tourism", "agriculture", "real-estate"],
    investmentType: "partnership" as const,
  },
  {
    id: "a3000001-0000-4000-8000-000000000003",
    title: "Инвестиционное предложение 25 млн ₽",
    description:
      "Beta-кейс: заёмное финансирование производственных проектов без реальных ПДн.",
    amountMin: 10_000_000,
    amountMax: 25_000_000,
    currency: "RUB",
    regions: ["Поволжье", "Урал"],
    categories: ["production", "energy", "trade"],
    investmentType: "loan" as const,
  },
] as const;

export const demoExpertsSeed = [
  {
    id: "a4000001-0000-4000-8000-000000000001",
    userId: "a0000001-0000-4000-8000-000000000011",
    email: "demo.lawyer@ckr.local",
    specialization: "lawyer" as const,
    headline: "Юридическое сопровождение сделок и проектов",
    description:
      "Демо-профиль: корпоративное право, инвестиционные соглашения, проверка контрагентов.",
    experienceYears: 12,
    services: "Договоры, due diligence, структура сделки",
    region: "Москва",
    fullName: "Эксперт-юрист (демо)",
  },
  {
    id: "a4000001-0000-4000-8000-000000000002",
    userId: "a0000001-0000-4000-8000-000000000012",
    email: "demo.accountant@ckr.local",
    specialization: "accountant" as const,
    headline: "Финансовый учёт и налоговая модель проекта",
    description:
      "Демо-профиль: постановка учёта, финмодель для инвестора, отчётность.",
    experienceYears: 9,
    services: "Учёт, налоги, финансовая модель",
    region: "Казань",
    fullName: "Эксперт-бухгалтер (демо)",
  },
  {
    id: "a4000001-0000-4000-8000-000000000003",
    userId: "a0000001-0000-4000-8000-000000000013",
    email: "demo.marketer@ckr.local",
    specialization: "marketer" as const,
    headline: "Маркетинг запуска и привлечение клиентов",
    description:
      "Демо-профиль: позиционирование, digital-каналы, материалы для инвесторов.",
    experienceYears: 8,
    services: "Стратегия, запуск, презентации",
    region: "Санкт-Петербург",
    fullName: "Эксперт-маркетолог (демо)",
  },
  {
    id: "a4000001-0000-4000-8000-000000000004",
    userId: "a0000001-0000-4000-8000-000000000014",
    email: "demo.engineer@ckr.local",
    specialization: "engineer" as const,
    headline: "Инженерное сопровождение производственных проектов",
    description:
      "Демо-профиль: подбор оборудования, техзадания, контроль запуска линии.",
    experienceYears: 15,
    services: "Технадзор, оборудование, запуск",
    region: "Екатеринбург",
    fullName: "Эксперт-инженер (демо)",
  },
] as const;
