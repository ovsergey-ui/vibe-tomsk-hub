import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLeadDialog } from "@/lib/lead-dialog";

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Индивидуальная разработка — tomsk.ai" },
      {
        name: "description",
        content:
          "Индивидуальные AI-решения, Telegram automation, MVP и mini SaaS. Соберём решение под ваш бизнес.",
      },
      { property: "og:title", content: "Индивидуальная разработка — tomsk.ai" },
      { property: "og:url", content: "/custom" },
    ],
    links: [{ rel: "canonical", href: "/custom" }],
  }),
  component: CustomPage,
});

const TASKS = [
  { t: "Telegram automation", d: "Боты, рассылки, интеграции, AI-консьержи." },
  { t: "AI-инструменты", d: "Ассистенты, генерация контента, разбор данных." },
  { t: "MVP за 2–4 недели", d: "Быстрый рабочий прототип идеи под проверку гипотез." },
  { t: "Mini SaaS", d: "Лёгкие SaaS-сервисы под конкретную нишу." },
  { t: "Внутренние сервисы", d: "Авто-отчёты, разбор писем, генерация документов." },
  { t: "Интеграции", d: "Связываем CRM, формы, сайт и Telegram в одну воронку." },
];

function CustomPage() {
  const open = useLeadDialog((s) => s.openDialog);
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Индивидуальная разработка
        </h1>
        <p className="mt-4 text-muted-foreground sm:text-lg">
          Собираем AI-решения и автоматизацию под ваш процесс. Без шаблонных коробок —
          фокус на задаче и быстром запуске.
        </p>
        <div className="mt-6">
          <Button size="lg" onClick={() => open({ source: "custom" })}>
            Обсудить задачу
          </Button>
        </div>
      </header>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">Какие задачи берём</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TASKS.map((t) => (
            <div key={t.t} className="rounded-2xl border border-border bg-card p-6">
              <div className="text-base font-semibold tracking-tight">{t.t}</div>
              <div className="mt-2 text-sm text-muted-foreground">{t.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-3xl border border-border bg-card p-8 sm:p-12">
        <h2 className="text-2xl font-semibold tracking-tight">Как мы работаем над индивидуальным проектом</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["01", "Бриф", "30 минут на разговор о задаче и контексте."],
            ["02", "Оценка", "Этапы, сроки, стоимость. Без сюрпризов."],
            ["03", "Прототип", "Запускаем рабочую версию за 1–2 недели."],
            ["04", "Запуск", "Внедряем, обучаем команду, сопровождаем."],
          ].map(([n, t, d]) => (
            <li key={n}>
              <div className="font-mono text-xs text-muted-foreground">{n}</div>
              <div className="mt-1 text-lg font-semibold tracking-tight">{t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{d}</div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}