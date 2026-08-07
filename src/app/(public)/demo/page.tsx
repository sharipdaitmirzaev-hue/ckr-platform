import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";
import { isDemoMode } from "@/lib/demo/mode";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Демонстрация ЦКР",
  description:
    "Как смотреть платформу ЦКР без регистрации: каталоги открыты, личные данные скрыты.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: `Демо · ${siteConfig.name}`,
    description: "Безопасный показ ЦКР для инвесторов и партнёров.",
    url: "/demo",
  },
};

const openCatalogs = [
  { href: "/projects", label: "Проекты" },
  { href: "/opportunities", label: "Возможности" },
  { href: "/investments", label: "Инвестиции" },
  { href: "/experts", label: "Эксперты" },
];

const hidden = [
  "Телефоны и контакты участников",
  "Документы и заявки на проверку",
  "Переписка и сообщения",
  "Кабинет проекта и сделки",
];

export default function DemoPage() {
  return (
    <div className="py-14 sm:py-16">
      <Container className="max-w-3xl">
        <Badge variant="accent">
          {isDemoMode() ? "Demo mode включён" : "Демонстрационный доступ"}
        </Badge>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Смотрите ЦКР без регистрации
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Каталоги платформы открыты для показа инвесторам, партнёрам и первым
          пользователям. Личные данные, документы и переписка остаются закрытыми.
        </p>

        <section className="mt-12 border-t border-border pt-10">
          <SectionHeading
            eyebrow="Доступно"
            title="Публичные каталоги"
            description="Демо-наполнение безопасно: вымышленные компании и роли."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            {openCatalogs.map((item) => (
              <ButtonLink key={item.href} href={item.href} variant="outline">
                {item.label}
              </ButtonLink>
            ))}
          </div>
        </section>

        <section className="mt-12 border-t border-border pt-10">
          <SectionHeading
            eyebrow="Скрыто"
            title="Что не показываем гостям"
          />
          <ul className="mt-6 space-y-3">
            {hidden.map((item) => (
              <li
                key={item}
                className="border-l border-accent/40 pl-4 text-sm text-muted"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 border-t border-border pt-10">
          <h2 className="font-display text-xl text-foreground">
            Хотите полный сценарий?
          </h2>
          <p className="mt-3 text-sm text-muted">
            Зарегистрируйтесь и пройдите онбординг — ЦКР подскажет первый шаг
            по роли: проект с Лией, поиск проектов или профиль эксперта.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/register">Создать аккаунт</ButtonLink>
            <ButtonLink href="/lia" variant="outline">
              Попробовать Лию
            </ButtonLink>
          </div>
        </section>
      </Container>
    </div>
  );
}
