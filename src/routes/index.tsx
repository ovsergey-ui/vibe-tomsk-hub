import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bot, Sparkles, Workflow, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLeadDialog } from "@/lib/lead-dialog";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "tomsk.ai — AI-решения и автоматизация для бизнеса в Томске" },
      {
        name: "description",
        content:
          "Telegram-боты, AI-инструменты и автоматизация. Запускаем решения для бизнеса в Томске за дни, а не месяцы.",
      },
      { property: "og:title", content: "tomsk.ai — AI-решения и автоматизация для бизнеса" },
      {
        property: "og:description",
        content: "Telegram-боты, AI-инструменты и автоматизация для быстрых запусков.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((q) => ({
            "@type": "Question",
            name: q.q,
            acceptedAnswer: { "@type": "Answer", text: q.a },
          })),
        }),
      },
    ],
  }),
  component: HomePage,
});

const PERKS = [
  { icon: Sparkles, title: "Запуск от 3 дней", text: "Прототип на старте, не ждём месяцами." },
  { icon: Bot, title: "Telegram-first", text: "Боты и интеграции там, где живут ваши клиенты." },
  { icon: Workflow, title: "AI + автоматизация", text: "Соединяем AI с реальными бизнес-процессами." },
  { icon: LifeBuoy, title: "Поддержка после", text: "Не бросаем после запуска — сопровождаем." },
];

const CASES = [
  {
    tag: "Telegram-бот",
    title: "Приём заявок и квалификация",
    text: "Бот собирает заявки, задаёт уточняющие вопросы и присылает менеджеру в личку. Запуск — 2 дня.",
  },
  {
    tag: "AI-ассистент",
    title: "Консультант для клиентов 24/7",
    text: "AI отвечает по базе знаний компании, передаёт сложные кейсы человеку, экономит часы.",
  },
  {
    tag: "Автоматизация",
    title: "Единая воронка заявок",
    text: "Сайт, формы и Telegram собираются в одно место. Никаких потерянных лидов и забытых писем.",
  },
];

const STEPS = [
  { n: "01", t: "Обсуждение", d: "Понимаем задачу и контекст. Без воды." },
  { n: "02", t: "Прототип", d: "Быстрый прототип, чтобы проверить идею в деле." },
  { n: "03", t: "Разработка", d: "Собираем рабочее решение и интегрируем." },
  { n: "04", t: "Запуск и поддержка", d: "Запускаем, обучаем команду, остаёмся на связи." },
];

const FAQ = [
  {
    q: "Сколько стоит проект?",
    a: "Готовые решения — от 25 000 ₽. Индивидуальные — обсуждаем по задаче, считаем после короткого брифа.",
  },
  { q: "Как быстро запускаете?", a: "Простые боты — 2–3 дня, AI-ассистент — 5–7 дней, индивидуальные проекты — 2–4 недели." },
  { q: "Работаете только в Томске?", a: "Команда в Томске, клиенты — по всей России. Все процессы онлайн." },
  { q: "Что с поддержкой после запуска?", a: "Минимум 30 дней сопровождения включено. Дальше — по договорённости." },
  { q: "Можно ли подключить AI к нашим данным?", a: "Да. Обучаем модели на ваших регламентах, прайсах, FAQ и CRM-данных." },
];

function HomePage() {
  const open = useLeadDialog((s) => s.openDialog);
  const { data: products } = useQuery({
    queryKey: ["home-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("slug,title,summary,price_from,timeline")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 md:pb-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              AI-студия · Томск
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              AI-решения и автоматизация для бизнеса
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Telegram-боты, mini-сервисы и AI-инструменты для быстрого запуска идей и автоматизации процессов.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/catalog">
                  Смотреть решения <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => open({ source: "hero" })}>
                Обсудить проект
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden bg-border px-0 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((p) => (
            <div key={p.title} className="bg-background p-6">
              <p.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-semibold tracking-tight">{p.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{p.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cases */}
      <Section title="Что мы запускаем" subtitle="Примеры решений, которые уже работают у клиентов">
        <div className="grid gap-4 md:grid-cols-3">
          {CASES.map((c) => (
            <article key={c.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.tag}</span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Catalog preview */}
      <Section
        title="Готовые решения"
        subtitle="Наборы, которые запускаем быстро — на их основе делаем кастом"
        action={
          <Link to="/catalog" className="text-sm font-medium text-foreground hover:underline">
            Весь каталог →
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(products ?? []).map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section title="Как мы работаем">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-background p-6">
              <div className="text-xs font-mono text-muted-foreground">{s.n}</div>
              <div className="mt-2 text-lg font-semibold tracking-tight">{s.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section title="Частые вопросы">
        <Accordion type="single" collapsible className="w-full">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`f-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-10 text-center sm:p-14">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Расскажите задачу — предложим решение под ваш бизнес
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Ответим в течение рабочего дня. Без формальностей и долгих презентаций.
          </p>
          <div className="mt-6">
            <Button size="lg" onClick={() => open({ source: "final-cta" })}>
              Оставить заявку
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
