import { Logo } from "@/components/brand/logo";
import { LiaWidget } from "@/components/lia/lia-widget";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/config/brand";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial"
        />
        <div
          aria-hidden
          className="ckr-grid-overlay pointer-events-none absolute inset-0 bg-hero-grid opacity-40"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent"
        />

        <Container className="relative flex min-h-[calc(100vh-4.25rem)] flex-col justify-center py-16 sm:py-20">
          <div className="max-w-3xl">
            <div className="animate-fade-in">
              <Logo size="lg" href="" />
              <p className="mt-3 text-sm uppercase tracking-[0.28em] text-muted">
                {brand.fullName}
              </p>
            </div>

            <div
              aria-hidden
              className="animate-line-draw mt-8 h-px w-24 origin-left bg-accent"
            />

            <h1 className="animate-fade-up mt-8 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem] lg:leading-[1.12]">
              {brand.tagline}
            </h1>

            <p
              className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
              style={{ animationDelay: "120ms" }}
            >
              Центр комплексных решений для бизнеса: от идеи до реализации —
              анализ, ресурсы, партнёры и сопровождение в одной платформе.
            </p>

            <div
              className="animate-fade-up mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "220ms" }}
            >
              <ButtonLink href="/projects" size="lg">
                Найти возможности
              </ButtonLink>
              <ButtonLink href="/dashboard/projects/create" variant="outline" size="lg">
                Разместить проект
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Путь ЦКР"
            title="Идея → анализ → решения → ресурсы → реализация"
            description="Платформа ведёт бизнес от замысла к результату: помогает увидеть картину целиком и собрать нужные решения."
          />

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {brand.journey.map((step, index) => (
              <li
                key={step}
                className="border-l border-accent/40 pl-4"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  0{index + 1}
                </p>
                <p className="mt-2 font-display text-lg font-medium text-foreground">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Модули платформы"
              title="Всё необходимое для комплексного решения"
              description="Каталоги и сервисы ЦКР закрывают разные стороны бизнес-задачи — от капитала и активов до экспертизы."
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Проекты",
                  text: "Идеи и бизнесы, которым нужны инвестиции, активы и партнёры.",
                  href: "/projects",
                },
                {
                  title: "Возможности",
                  text: "Земля, помещения, оборудование, готовый бизнес и технологии.",
                  href: "/opportunities",
                },
                {
                  title: "Решения",
                  text: "Комплексные предложения: инвестор, ресурсы, юристы, маркетинг.",
                  href: "/solutions",
                },
                {
                  title: "Кабинет",
                  text: "Управление проектами, заявками и документами в одном месте.",
                  href: "/dashboard",
                },
              ].map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="group block border-t border-border pt-4 transition-colors hover:border-accent/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl text-foreground group-hover:text-accent">
                      {item.title}
                    </h3>
                    <span className="text-accent transition-transform duration-200 group-hover:translate-x-0.5">
                      →
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.text}
                  </p>
                </a>
              ))}
            </div>
          </div>

          <LiaWidget embedded />
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-xl">
            <Badge variant="accent">Старт платформы</Badge>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Начните с регистрации
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Создайте профиль предпринимателя, инвестора, эксперта или компании
              — и подключитесь к экосистеме ЦКР.
            </p>
          </div>
          <ButtonLink href="/register" size="lg">
            Создать аккаунт
          </ButtonLink>
        </Container>
      </section>
    </>
  );
}
