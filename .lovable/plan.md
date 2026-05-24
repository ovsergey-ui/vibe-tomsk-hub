## План: AI чат-бот на сайте + панель оператора

### 1. База данных

Создать две таблицы:

- `chat_sessions` — `id`, `name`, `phone` (уникальный), `consent_at`, `status` (`bot` / `escalated` / `closed`), `created_at`, `updated_at`, `last_message_at`.
- `chat_messages` — `id`, `session_id` (FK), `role` (`user` / `assistant` / `admin` / `system`), `content`, `created_at`.

RLS:

- Публичный INSERT и SELECT по `id` сессии (id хранится в localStorage клиента, выступает токеном). Админы — полный доступ через `has_role('admin')`.
- Включить Realtime для `chat_messages` и `chat_sessions`, чтобы клиент и админ видели новые сообщения мгновенно.

### 2. Виджет на сайте (правый нижний угол)

Новый компонент `ChatWidget` встраивается в `__root.tsx` (рядом с `LeadDialog`).

- Плавающая круглая кнопка с иконкой бота.
- При клике — карточка чата.
- Первый шаг: форма «Имя + Телефон + чекбокс согласия с политикой конфиденциальности» (обязательно). После отправки — серверная функция `startChatSession`:
  - ищет сессию по телефону → если есть, подгружает историю;
  - иначе создаёт новую, шлёт приветственное сообщение от бота.
  - id сессии сохраняется в `localStorage` (быстрый повторный вход без формы).
- Второй шаг: лента сообщений + поле ввода. Подписка на Realtime для новых сообщений (от админа или бота).

### 3. AI-логика бота (Lovable AI Gateway, `google/gemini-2.5-flash`)

Серверная функция `sendChatMessage`:

1. Сохраняет сообщение пользователя.
2. Собирает контекст: системный промпт + актуальный каталог `products` (title, summary, price_from, slug) + последние ~20 сообщений.
3. Системный промпт: бот консультирует по продуктам tomsk.ai, помогает оставить заявку (готовое решение или индивидуальная разработка). Поддерживается tool calling:
  - `create_lead` — сохраняет заявку в `leads` (`source = "chatbot"`, привязка к `product_id`, сообщение из обсуждения). Уведомление в Telegram через существующий helper.
  - `escalate_to_admin` — переводит сессию в `status = escalated`, бот отвечает «Передаю ваш вопрос администратору, пожалуйста ожидайте, с вами скоро свяжутся», в Telegram уходит уведомление о новом тикете.
4. Если сессия уже `escalated` — бот молчит, отвечает админ.

### 4. Админка (`/_panel/chats`)

Новая страница:

- Список всех сессий (новые сверху, бейдж «тикет» для `escalated`, индикатор непрочитанных).
- При выборе — переписка + поле ввода для админа.
- Серверная функция `sendAdminMessage` сохраняет сообщение с `role = "admin"` (после этого бот замолкает), клиент видит через Realtime.
- Кнопки «Закрыть тикет» (`status = closed`) и «Вернуть боту» (`status = bot`).
- Ссылка «Чаты» добавляется в навигацию `_panel.tsx`.

### 5. Уведомления в Telegram

Переиспользуется существующий `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`. Отправляется при эскалации и при создании заявки из чата.

### Файлы

- Миграция: `chat_sessions`, `chat_messages`, RLS, realtime.
- `src/components/site/ChatWidget.tsx` (+ подкомпоненты формы и ленты).
- `src/lib/chat.functions.ts` — `startChatSession`, `getChatHistory`, `sendChatMessage`, `sendAdminMessage`, `escalateChat`, `closeChat`.
- `src/lib/chat.server.ts` — вызов Lovable AI Gateway, сборка контекста, tool dispatch.
- `src/routes/_panel/chats.tsx` — UI оператора.
- Правки: `src/routes/__root.tsx` (монтаж виджета), `src/routes/_panel.tsx` (пункт навигации).

### Технические детали

- Lovable AI: `LOVABLE_API_KEY` уже есть, модель `google/gemini-2.5-flash`, tool calling для `create_lead` / `escalate_to_admin`.
- Идентификация клиента — по `session_id` в `localStorage` + телефону. Без паролей.
- Согласие с политикой обязательно (чекбокс + блокировка кнопки).
- Валидация Zod на сервере и клиенте.