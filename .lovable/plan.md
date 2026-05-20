## Что строим

Современный сайт AI-студии (Томск) — Telegram-боты, AI и автоматизация. Никакого «магазина»: заявки вместо корзины, акцент на доверии и быстром запуске. Слово «вайбкодинг» не используем на главной.

**Стек:** TanStack Start + Tailwind v4 + Lovable Cloud + Zustand + React Query.

---

## Маршруты

```
src/routes/
  __root.tsx              Header + Footer, шрифты, базовое SEO
  index.tsx               Главная
  catalog.tsx             Каталог решений
  products.$slug.tsx      Карточка решения
  custom.tsx              Индивидуальная разработка
  contacts.tsx            Контакты
  privacy.tsx             Политика конфиденциальности
  offer.tsx               Публичная оферта
  login.tsx               Вход админа
  _admin.tsx              Guard (auth + проверка роли)
  _admin/products.tsx     Управление решениями
  _admin/leads.tsx        Заявки
  sitemap[.]xml.ts        Sitemap
```

`public/robots.txt` + JSON-LD Organization в `__root.tsx`.

---

## Главная

1. **Hero** — «AI-решения и автоматизация для бизнеса», подзаголовок про Telegram-боты и mini-сервисы, две кнопки: «Смотреть решения» / «Обсудить проект».
2. **Преимущества** — 4 карточки: запуск от 3 дней · Telegram-first · AI + automation · поддержка после запуска.
3. **Кейсы** — 2–3 демо (Telegram-бот для заявок, AI-ассистент, автоматизация).
4. **Готовые решения** — 4–5 карточек из БД (Telegram-боты, AI-чат, автоматизация заявок, Mini CRM, AI-консультант).
5. **Как работаем** — 4 шага: обсуждение → прототип → разработка → запуск/поддержка.
6. **FAQ** — 5–6 вопросов (аккордеон).
7. **Финальный CTA** — кнопка «Оставить заявку» (открывает модалку с формой).

## Каталог

Сетка карточек (без сайдбар-фильтров): название, краткое описание, «от X ₽», срок запуска, CTA «Обсудить». Простой поиск по названию — опционально.

## Карточка решения (`/products/:slug`)

Шапка: название, описание, цена «от», срок, кнопка «Оставить заявку». Блоки: «Что решает», «Что входит», «Для кого», «Этапы запуска», FAQ. Внизу — 2–3 похожих решения.

## Индивидуальная разработка (`/custom`)

Описание задач (Telegram automation, AI-инструменты, MVP, mini SaaS, внутренние сервисы) + форма: имя, Telegram, email, описание задачи. Отправка → таблица `leads` с `product_id = null`.

## Контакты

Telegram, email, город (Томск), короткая форма связи.

---

## Дизайн-система

Светлый SaaS/editorial:
- Фон `#fafbfc`, surface `#ffffff`, текст `#0f172a`, muted `#94a3b8`, accent `#3b82f6` — все токены в `src/styles.css` (oklch).
- Шрифты: Space Grotesk (заголовки) + DM Sans (текст), подключаем в `__root.tsx`.
- Тонкие границы 1px, радиус 12–16px, мягкие тени, спокойные ховеры. Без неона, 3D и glassmorphism.

---

## Админка (MVP)

- **Auth:** email/пароль через Lovable Cloud. Первый админ заводится вручную, регистрация закрыта.
- **Guard:** `_admin.tsx` через `beforeLoad` — проверяет сессию и роль `admin` (таблица `user_roles` + security-definer `has_role`).
- **Products:** список + форма (название, slug, price_from, краткое/полное описание, features, категория, cover_url, is_active).
- **Leads:** таблица (имя, контакт, комментарий, продукт, статус); смена статуса new → in_progress → done. Без метрик и архивации.

---

## База данных

```text
categories   id, slug, title
products     id, slug, title, price_from, category_id, summary,
             description, features (jsonb), cover_url, is_active, created_at
leads        id, name, telegram, email, message, product_id (nullable),
             status ('new'|'in_progress'|'done'), created_at
user_roles   id, user_id, role app_role  +  has_role() SECURITY DEFINER
```

**RLS:**
- `products`, `categories`: публичный SELECT (only `is_active=true` для products); write — admin.
- `leads`: публичный INSERT (Zod-валидация на сервере); SELECT/UPDATE — admin.
- `user_roles`: read/write — admin.

## Server functions (`src/lib/*.functions.ts`)

Минимум:
- `listProducts`, `getProductBySlug` — публичные (через `supabaseAdmin`, фильтр `is_active`).
- `createLead` — публичная, Zod-валидация (имя, телефон/telegram, email, длины).
- `adminUpsertProduct`, `adminListLeads`, `adminUpdateLeadStatus` — под `requireSupabaseAuth` + проверка роли admin.

---

## SEO

- `head()` на каждом маршруте: title, description, og:title/og:description/og:url.
- og:image — только там, где есть осмысленный визуал (генерим при необходимости).
- JSON-LD Organization в `__root.tsx`, Product — в карточке решения, FAQPage — на главной.
- `sitemap[.]xml.ts` server route с динамическим списком активных продуктов + статичные маршруты.
- `public/robots.txt` с `Allow: /`, `Disallow: /_admin/`, `/login`.

## Аналитика

Не подключаю в первой итерации — добавим PostHog или Plausible вторым шагом, чтобы не задерживать запуск. Если нужно сразу — скажи, какой провайдер.

---

## План работ

1. Включаю Lovable Cloud + миграции (categories, products, leads, user_roles, has_role, RLS).
2. Дизайн-токены в `styles.css`, шрифты, Header/Footer, базовый layout, Toaster.
3. Главная, каталог, карточка решения; модалка «Оставить заявку» (Zustand для выбранного продукта).
4. `/custom`, `/contacts`, `/privacy`, `/offer`.
5. `/login` + `_admin` guard + `_admin/products` + `_admin/leads`.
6. Seed: 3 категории + 6 решений с демо-контентом.
7. SEO: `head()` на всех маршрутах, JSON-LD, `sitemap.xml`, `robots.txt`.
8. Проверка адаптивности.

После апрува начну с шага 1.