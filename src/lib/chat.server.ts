import { supabaseAdmin } from "@/integrations/supabase/client.server";

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("Telegram send failed", res.status, await res.text());
    }
  } catch (e) {
    console.error("Telegram send error", e);
  }
}

type ChatMessage = { role: "user" | "assistant" | "admin" | "system"; content: string };

const SYSTEM_PROMPT_BASE = `Ты — AI-консультант студии tomsk.ai. Помогаешь клиентам подобрать готовое решение из каталога или оформить заявку на индивидуальную разработку.

Что мы делаем:
- AI-решения, чат-боты, автоматизация процессов.
- Разработка сайтов: лендинги, корпоративные сайты, каталоги, интернет-магазины, веб-приложения и личные кабинеты.
- Интеграции с внешними сервисами и индивидуальная разработка под задачу клиента.

Правила:
- Отвечай кратко, по-русски, дружелюбно и по делу.
- Опирайся на каталог продуктов (передан ниже). Если клиент описывает задачу — предложи подходящее решение и кратко объясни почему.
- Если клиент прислал картинку (скриншот сайта, интерфейса, схему, пример) — внимательно изучи её, опиши кратко что видишь и подбери максимально близкое решение из каталога. Если ничего не подходит — предложи индивидуальную разработку.
- Если задача (включая разработку сайта) не покрыта готовым решением — предложи индивидуальную разработку. Задай 1–2 уточняющих вопроса: какой тип сайта/проекта, цель, есть ли дизайн и контент, ориентир по срокам.
- Когда клиент готов оставить заявку — вызови инструмент create_lead с product_id (если подходит готовое решение) или без него (для индивидуальной разработки, в том числе сайтов). В message кратко опиши, что нужно клиенту.
- Если клиент задаёт сложный вопрос вне твоей компетенции, просит позвать менеджера/администратора, или ты не можешь помочь — вызови escalate_to_admin с причиной. В ответе клиенту скажи: «Передаю ваш вопрос администратору, с вами скоро свяжутся».
- Не выдумывай цены, сроки и характеристики, которых нет в каталоге. Для сайтов и индивидуальной разработки честно говори, что точную оценку даст менеджер после уточнения требований.
- На посторонние темы мягко возвращай разговор к тому, чем студия может помочь.`;

export async function buildSystemPrompt(): Promise<string> {
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id,title,slug,summary,price_from,timeline")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const catalog = (products ?? [])
    .map(
      (p) =>
        `- id: ${p.id}\n  название: ${p.title}\n  кратко: ${p.summary || "—"}\n  от: ${p.price_from} ₽\n  сроки: ${p.timeline || "—"}`,
    )
    .join("\n");

  return `${SYSTEM_PROMPT_BASE}\n\nКАТАЛОГ ПРОДУКТОВ:\n${catalog || "(пусто)"}`;
}

type ToolCall = {
  name: "create_lead" | "escalate_to_admin";
  arguments: Record<string, unknown>;
};

type AIResult = {
  text: string;
  toolCalls: ToolCall[];
};

export async function callAI(messages: ChatMessage[], systemPrompt: string): Promise<AIResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const payload = {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "admin" ? "assistant" : m.role,
          content: m.role === "admin" ? `[Сообщение администратора]: ${m.content}` : m.content,
        })),
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "create_lead",
          description:
            "Создать заявку для клиента. Используй когда клиент согласен оставить заявку.",
          parameters: {
            type: "object",
            properties: {
              product_id: {
                type: "string",
                description: "UUID продукта из каталога. Опусти, если заявка на индивидуальную разработку.",
              },
              message: {
                type: "string",
                description: "Краткое описание задачи клиента (1-3 предложения).",
              },
            },
            required: ["message"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "escalate_to_admin",
          description:
            "Передать диалог администратору, если бот не может помочь или клиент явно просит человека.",
          parameters: {
            type: "object",
            properties: {
              reason: { type: "string", description: "Краткая причина эскалации." },
            },
            required: ["reason"],
            additionalProperties: false,
          },
        },
      },
    ],
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("AI gateway error", res.status, text);
    if (res.status === 429) throw new Error("Слишком много запросов. Попробуйте через минуту.");
    if (res.status === 402) throw new Error("AI временно недоступен.");
    throw new Error("AI временно недоступен.");
  }

  const data = await res.json();
  const choice = data.choices?.[0]?.message ?? {};
  const text = (choice.content as string) || "";
  const toolCalls: ToolCall[] = [];
  for (const tc of choice.tool_calls ?? []) {
    try {
      const args = JSON.parse(tc.function?.arguments || "{}");
      toolCalls.push({ name: tc.function?.name, arguments: args });
    } catch (e) {
      console.error("Bad tool args", e);
    }
  }
  return { text, toolCalls };
}