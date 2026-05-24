## Что обнаружено при анализе

**Критический баг — заявки и каталог.** Сетевой лог показывает 403 от Supabase: `permission denied for function has_role` при запросах к `products`. То же сейчас может ронять и сохранение заявок (RLS-политики продуктов/категорий вызывают `has_role`, и роль `anon` не имеет EXECUTE на функцию). Из-за этого:
- публичный сайт не грузит каталог,
- форма заявки падает на любом запросе, который рядом дергает products/categories.

**Форма заявки** не содержит телефон и обязательного согласия с политикой; в БД `leads` нет колонки `phone`.

**Форма продукта** в админке имеет дубль поля «Обложка» (загрузка файла + URL внизу) — путаница.

**Учёт заявок** — есть бейдж «новые», но нет цельной картины: статусы переключаются вручную внутри модалки, нет дашборда с метриками.

**Визуал админки** не совпадает с сайтом: плоский top-nav, нет карточек/градиентов/мягких теней, цифры и таблицы без акцентов. Сайт у нас тёмный, премиальный — админка должна это поддержать.

## План изменений

### 1. Миграция БД

- `GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated` — лечит 403 на публичных страницах и в форме заявки.
- В `leads` добавить колонку `phone text`.
- Обновить INSERT-политику `Anyone can create leads`: разрешить телефон как третий вариант контакта (`telegram IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL`) и добавить чек длины.

### 2. Форма заявки (`LeadDialog.tsx` + `src/lib/schema.ts` + `leads.functions.ts`)

- Добавить поле **Имя (обяз.)**, **Телефон (обяз.)**, **Email (необяз.)**, **Telegram (необяз.)**, сообщение.
- Добавить **обязательный чекбокс** «Согласен с политикой конфиденциальности» со ссылкой на `/privacy`. Без галки кнопка submit задизейблена + текст ошибки.
- Обновить `leadSchema` (zod): `phone` обязателен, маска/regex для RU-номера, длины полей.
- Обновить server fn `submitLead` чтобы принимать и сохранять `phone`.

### 3. Чистка формы продукта (`_panel/products.tsx`)

- Убрать второе поле «Обложка (URL)» внизу формы — оставить только `ImageUploader`, который и так возвращает URL.
- Мелкий рефакторинг: вынести `ProductForm` в отдельный файл `src/components/admin/ProductForm.tsx`.

### 4. Учёт заявок (`_panel/leads.tsx`)

- В таблице показывать **телефон** колонкой, кликабельный `tel:`.
- Быстрая смена статуса прямо в строке (Select: новая / в работе / закрыта) — без открытия модалки.
- Цветные бейджи статусов (semantic tokens).
- Кнопка «Скопировать все контакты» в карточке заявки.

### 5. Дашборд админки (новый роут `_panel/index.tsx`)

- 4 карточки-метрики: новые заявки за 7 дней, всего заявок, активных решений, скрытых.
- Блок «Последние 5 заявок» со ссылкой на полный список.
- Блок «Топ категорий» по числу продуктов.
- В навигации сделать первым пунктом «Обзор».

### 6. Стиль админки под сайт (`_panel.tsx` + страницы)

Без правок дизайна публичного сайта — только админка.

- Шапку панели обернуть в «стеклянную» карточку с `bg-card/60 backdrop-blur border border-border rounded-2xl`, отделить от контента вертикальным отступом.
- Таблицы: `rounded-2xl` карточка, шапка `bg-muted/40`, hover-строки `hover:bg-muted/30`, плотность строк 56px, типографика `tracking-tight`.
- Кнопки и инпуты — единые радиусы (`rounded-xl`), фокус-кольца через `--ring`.
- Бейдж новых заявок — `bg-primary text-primary-foreground` (как акценты сайта), статусы — мягкие пастельные подложки через токены.
- Адаптив: nav сворачивается в горизонтальный скролл на мобильных, кнопка «Выйти» уходит в `…`-меню.
- Использовать только semantic tokens из `src/styles.css` — никаких хардкод-цветов.

### Что НЕ входит в этот заход

- Уведомления о смене статуса клиенту (email/Telegram бота).
- Экспорт в CSV/Excel.
- История изменений заявки.
- Редизайн публичного сайта.

## Технические детали

Файлы:

- **Создаём:** `src/routes/_panel/index.tsx`, `src/components/admin/ProductForm.tsx`, новая миграция SQL.
- **Правим:** `src/lib/schema.ts`, `src/lib/leads.functions.ts`, `src/components/site/LeadDialog.tsx`, `src/routes/_panel.tsx`, `src/routes/_panel/leads.tsx`, `src/routes/_panel/products.tsx`.

SQL миграции:

```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

ALTER TABLE public.leads ADD COLUMN phone text;

DROP POLICY "Anyone can create leads" ON public.leads;
CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT TO public
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 200
    AND char_length(COALESCE(message, '')) <= 5000
    AND char_length(COALESCE(phone, '')) <= 32
    AND (telegram IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL)
  );
```

Подтверди план — и я приступаю к исполнению.
