import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const submitLeadInput = z.object({
  name: z.string().trim().min(1).max(200),
  telegram: z.string().trim().max(120).nullable().optional(),
  email: z.string().trim().email().max(255).nullable().optional(),
  message: z.string().trim().max(5000).optional().default(""),
  product_id: z.string().uuid().nullable().optional(),
  source: z.string().max(50).default("site"),
});

async function sendTelegram(text: string) {
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

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data) => submitLeadInput.parse(data))
  .handler(async ({ data }) => {
    const telegram = data.telegram?.trim() || null;
    const email = data.email?.trim() || null;
    if (!telegram && !email) {
      throw new Error("Укажите Telegram или email");
    }

    let productTitle: string | null = null;
    if (data.product_id) {
      const { data: p } = await supabaseAdmin
        .from("products")
        .select("title")
        .eq("id", data.product_id)
        .maybeSingle();
      productTitle = p?.title ?? null;
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("leads")
      .insert({
        name: data.name,
        telegram,
        email,
        message: data.message || "",
        product_id: data.product_id ?? null,
        source: data.source,
        status: "new",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("Lead insert failed", error);
      throw new Error("Не удалось сохранить заявку");
    }

    const parts = [
      `<b>🆕 Новая заявка</b>`,
      `<b>Имя:</b> ${escapeHtml(data.name)}`,
      telegram ? `<b>Telegram:</b> ${escapeHtml(telegram)}` : null,
      email ? `<b>Email:</b> ${escapeHtml(email)}` : null,
      productTitle ? `<b>Решение:</b> ${escapeHtml(productTitle)}` : null,
      data.message ? `<b>Сообщение:</b>\n${escapeHtml(data.message)}` : null,
      `<b>Источник:</b> ${escapeHtml(data.source)}`,
    ].filter(Boolean);

    await sendTelegram(parts.join("\n"));

    return { id: inserted.id };
  });