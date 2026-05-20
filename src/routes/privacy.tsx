import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Политика конфиденциальности — tomsk.ai" },
      { name: "description", content: "Как мы обрабатываем персональные данные посетителей сайта tomsk.ai." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: () => (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 prose-base">
      <h1 className="text-3xl font-semibold tracking-tight">Политика конфиденциальности</h1>
      <p className="mt-4 text-sm text-muted-foreground">Обновлено: {new Date().getFullYear()}</p>
      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-foreground">
        <p>
          Настоящая политика описывает порядок обработки персональных данных посетителей сайта tomsk.ai
          (далее — «Сайт») в соответствии с Федеральным законом РФ № 152-ФЗ «О персональных данных».
        </p>
        <h2 className="text-lg font-semibold">1. Какие данные мы собираем</h2>
        <p>
          Имя, контактные данные (Telegram, email), текст сообщения, оставленный в форме заявки. Также
          могут собираться технические данные (cookies, IP-адрес) для работы Сайта и аналитики.
        </p>
        <h2 className="text-lg font-semibold">2. Цели обработки</h2>
        <p>Обработка заявок, связь с клиентами, улучшение качества сервиса, выполнение договорных обязательств.</p>
        <h2 className="text-lg font-semibold">3. Хранение и защита</h2>
        <p>
          Данные хранятся в защищённой инфраструктуре с ограничением доступа. Мы не передаём данные третьим
          лицам без вашего согласия, за исключением случаев, предусмотренных законом.
        </p>
        <h2 className="text-lg font-semibold">4. Ваши права</h2>
        <p>
          Вы можете запросить удаление или изменение данных, направив письмо на адрес hello@tomsk.ai.
        </p>
        <h2 className="text-lg font-semibold">5. Контакты</h2>
        <p>По всем вопросам, связанным с обработкой данных, пишите на hello@tomsk.ai.</p>
      </div>
    </article>
  ),
});