import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildSystemPrompt, callAI, escapeHtml, sendTelegram } from "@/lib/chat.server";

const phoneRegex = /^[+\d][\d\s\-()]{5,}$/;

const startInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(32).regex(phoneRegex),
  consent: z.literal(true),
});

export const startChatSession = createServerFn({ method: "POST" })
  .inputValidator((data) => startInput.parse(data))
  .handler(async ({ data }) => {
    const phone = data.phone.trim();
    const { data: existing } = await supabaseAdmin
      .from("chat_sessions")
      .select("id,status,name")
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      // Update name if changed; refresh activity.
      await supabaseAdmin
        .from("chat_sessions")
        .update({ name: data.name, last_message_at: new Date().toISOString() })
        .eq("id", existing.id);
      return { sessionId: existing.id, status: existing.status as string };
    }

    const { data: created, error } = await supabaseAdmin
      .from("chat_sessions")
      .insert({ name: data.name, phone, status: "bot" })
      .select("id,status")
      .single();
    if (error || !created) {
      console.error("chat session insert failed", error);
      throw new Error("Не удалось начать чат");
    }

    const greeting = `Здравствуйте, ${data.name}! Я AI-консультант tomsk.ai. Расскажите, какая задача — помогу подобрать решение или оформить заявку.`;
    await supabaseAdmin.from("chat_messages").insert({
      session_id: created.id,
      role: "assistant",
      content: greeting,
    });

    return { sessionId: created.id, status: created.status as string };
  });

const historyInput = z.object({
  sessionId: z.string().uuid(),
  afterId: z.string().uuid().nullable().optional(),
});

export const getChatHistory = createServerFn({ method: "POST" })
  .inputValidator((data) => historyInput.parse(data))
  .handler(async ({ data }) => {
    const { data: session } = await supabaseAdmin
      .from("chat_sessions")
      .select("id,name,status")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!session) throw new Error("Сессия не найдена");

    let q = supabaseAdmin
      .from("chat_messages")
      .select("id,role,content,created_at")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true });

    if (data.afterId) {
      const { data: cursor } = await supabaseAdmin
        .from("chat_messages")
        .select("created_at")
        .eq("id", data.afterId)
        .maybeSingle();
      if (cursor) q = q.gt("created_at", cursor.created_at);
    }

    const { data: messages, error } = await q;
    if (error) throw new Error("Не удалось загрузить историю");
    return { session, messages: messages ?? [] };
  });

const sendInput = z.object({
  sessionId: z.string().uuid(),
  content: z.string().trim().max(4000).optional().default(""),
  imageUrl: z.string().url().max(2000).optional().nullable(),
}).refine((d) => (d.content && d.content.length > 0) || !!d.imageUrl, {
  message: "Сообщение или картинка обязательны",
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data) => sendInput.parse(data))
  .handler(async ({ data }) => {
    const { data: session } = await supabaseAdmin
      .from("chat_sessions")
      .select("id,name,phone,status")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!session) throw new Error("Сессия не найдена");
    if (session.status === "closed") throw new Error("Чат закрыт");

    const now = new Date().toISOString();
    const storedContent = data.imageUrl
      ? `![image](${data.imageUrl})${data.content ? `\n${data.content}` : ""}`
      : data.content;
    await supabaseAdmin
      .from("chat_messages")
      .insert({ session_id: session.id, role: "user", content: storedContent });
    await supabaseAdmin
      .from("chat_sessions")
      .update({ last_message_at: now, updated_at: now })
      .eq("id", session.id);

    // Если эскалировано — бот не отвечает, ждёт админа.
    if (session.status === "escalated") return { ok: true };

    // Загрузить историю и вызвать AI
    const { data: history } = await supabaseAdmin
      .from("chat_messages")
      .select("role,content")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true })
      .limit(40);

    const systemPrompt = await buildSystemPrompt();
    let result;
    try {
      result = await callAI(
        (history ?? []).map((m) => ({
          role: m.role as "user" | "assistant" | "admin" | "system",
          content: m.content,
        })),
        systemPrompt,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI временно недоступен.";
      await supabaseAdmin.from("chat_messages").insert({
        session_id: session.id,
        role: "assistant",
        content: msg,
      });
      return { ok: true };
    }

    let replyText = result.text?.trim() || "";

    for (const tc of result.toolCalls) {
      if (tc.name === "create_lead") {
        const productId = (tc.arguments.product_id as string) || null;
        const message = (tc.arguments.message as string) || "Заявка из чата";
        let productTitle: string | null = null;
        if (productId) {
          const { data: p } = await supabaseAdmin
            .from("products")
            .select("title")
            .eq("id", productId)
            .maybeSingle();
          productTitle = p?.title ?? null;
        }
        const { data: lead } = await supabaseAdmin
          .from("leads")
          .insert({
            name: session.name,
            phone: session.phone,
            telegram: null,
            email: null,
            message,
            product_id: productId,
            source: "chatbot",
            status: "new",
          })
          .select("id")
          .single();

        const tgParts = [
          `<b>🆕 Заявка из чат-бота</b>`,
          `<b>Имя:</b> ${escapeHtml(session.name)}`,
          `<b>Телефон:</b> ${escapeHtml(session.phone)}`,
          productTitle ? `<b>Решение:</b> ${escapeHtml(productTitle)}` : `<b>Тип:</b> Индивидуальная разработка`,
          `<b>Сообщение:</b>\n${escapeHtml(message)}`,
        ];
        await sendTelegram(tgParts.join("\n"));

        if (!replyText) {
          replyText = productTitle
            ? `Отлично! Заявка на «${productTitle}» оформлена. Свяжемся с вами в ближайшее время.`
            : `Отлично! Заявка на индивидуальную разработку оформлена. Свяжемся в ближайшее время.`;
        }
        void lead;
      } else if (tc.name === "escalate_to_admin") {
        const reason = (tc.arguments.reason as string) || "Запрос помощи администратора";
        await supabaseAdmin
          .from("chat_sessions")
          .update({ status: "escalated", updated_at: now })
          .eq("id", session.id);

        const tgParts = [
          `<b>🔔 Новый тикет в чате</b>`,
          `<b>Клиент:</b> ${escapeHtml(session.name)} (${escapeHtml(session.phone)})`,
          `<b>Причина:</b> ${escapeHtml(reason)}`,
          `<b>Откройте админку:</b> раздел «Чаты»`,
        ];
        await sendTelegram(tgParts.join("\n"));

        if (!replyText) {
          replyText = "Передаю ваш вопрос администратору, с вами скоро свяжутся.";
        }
      }
    }

    if (replyText) {
      await supabaseAdmin.from("chat_messages").insert({
        session_id: session.id,
        role: "assistant",
        content: replyText,
      });
    }

    return { ok: true };
  });

const adminSendInput = z.object({
  sessionId: z.string().uuid(),
  content: z.string().trim().min(1).max(4000),
});

export const sendAdminMessage = createServerFn({ method: "POST" })
  .inputValidator((data) => adminSendInput.parse(data))
  .handler(async ({ data }) => {
    const now = new Date().toISOString();
    const { data: session } = await supabaseAdmin
      .from("chat_sessions")
      .select("id,status")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!session) throw new Error("Сессия не найдена");

    await supabaseAdmin.from("chat_messages").insert({
      session_id: data.sessionId,
      role: "admin",
      content: data.content,
    });
    const update: { last_message_at: string; updated_at: string; status?: string } = {
      last_message_at: now,
      updated_at: now,
    };
    if (session.status === "bot") update.status = "escalated";
    await supabaseAdmin.from("chat_sessions").update(update).eq("id", data.sessionId);
    return { ok: true };
  });

const sessionIdInput = z.object({ sessionId: z.string().uuid() });

export const closeChat = createServerFn({ method: "POST" })
  .inputValidator((data) => sessionIdInput.parse(data))
  .handler(async ({ data }) => {
    await supabaseAdmin
      .from("chat_sessions")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("id", data.sessionId);
    return { ok: true };
  });

export const returnChatToBot = createServerFn({ method: "POST" })
  .inputValidator((data) => sessionIdInput.parse(data))
  .handler(async ({ data }) => {
    await supabaseAdmin
      .from("chat_sessions")
      .update({ status: "bot", updated_at: new Date().toISOString() })
      .eq("id", data.sessionId);
    return { ok: true };
  });

export const listAdminChats = createServerFn({ method: "POST" }).handler(async () => {
  const { data: sessions, error } = await supabaseAdmin
    .from("chat_sessions")
    .select("id,name,phone,status,created_at,last_message_at")
    .order("last_message_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Не удалось загрузить чаты");
  return { sessions: sessions ?? [] };
});

export const getAdminChatHistory = createServerFn({ method: "POST" })
  .inputValidator((data) => sessionIdInput.parse(data))
  .handler(async ({ data }) => {
    const { data: session } = await supabaseAdmin
      .from("chat_sessions")
      .select("id,name,phone,status,created_at")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!session) throw new Error("Сессия не найдена");
    const { data: messages } = await supabaseAdmin
      .from("chat_messages")
      .select("id,role,content,created_at")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true });
    return { session, messages: messages ?? [] };
  });