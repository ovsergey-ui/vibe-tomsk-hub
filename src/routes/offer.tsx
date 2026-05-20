import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/offer")({
  head: () => ({
    meta: [
      { title: "Публичная оферта — tomsk.ai" },
      { name: "description", content: "Условия оказания услуг AI-студии tomsk.ai." },
      { property: "og:url", content: "/offer" },
    ],
    links: [{ rel: "canonical", href: "/offer" }],
  }),
  component: () => (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Публичная оферта</h1>
      <p className="mt-4 text-sm text-muted-foreground">Обновлено: {new Date().getFullYear()}</p>
      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-foreground">
        <p>
          Настоящий документ является официальным предложением (публичной офертой) AI-студии tomsk.ai
          (далее — «Исполнитель») и содержит существенные условия оказания услуг по разработке AI-решений,
          Telegram-ботов и автоматизации бизнес-процессов.
        </p>
        <h2 className="text-lg font-semibold">1. Предмет</h2>
        <p>
          Исполнитель оказывает услуги по разработке программного обеспечения, AI-инструментов и
          автоматизации в объёме, согласованном с заказчиком.
        </p>
        <h2 className="text-lg font-semibold">2. Стоимость и оплата</h2>
        <p>
          Стоимость определяется индивидуально на основании задачи и фиксируется в счёте или договоре.
          Оплата производится по реквизитам, указанным в счёте.
        </p>
        <h2 className="text-lg font-semibold">3. Сроки</h2>
        <p>Сроки согласовываются перед началом работ и фиксируются в счёте или договоре.</p>
        <h2 className="text-lg font-semibold">4. Передача и поддержка</h2>
        <p>
          После запуска Исполнитель передаёт исходный код и материалы заказчику, оказывает поддержку
          в рамках согласованного периода сопровождения.
        </p>
        <h2 className="text-lg font-semibold">5. Контакты</h2>
        <p>hello@tomsk.ai · Томск, Россия</p>
      </div>
    </article>
  ),
});