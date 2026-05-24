import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Paperclip, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  startChatSession,
  getChatHistory,
  sendChatMessage,
} from "@/lib/chat.functions";

type Msg = {
  id: string;
  role: "user" | "assistant" | "admin" | "system";
  content: string;
  created_at: string;
};

const STORAGE_KEY = "tomskai_chat_session";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", phone: "", consent: false });
  const [starting, setStarting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number | null>(null);

  const startFn = useServerFn(startChatSession);
  const historyFn = useServerFn(getChatHistory);
  const sendFn = useServerFn(sendChatMessage);

  // restore session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSessionId(saved);
    } catch {}
  }, []);

  // load + poll history
  useEffect(() => {
    if (!sessionId || !open) {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        // Use last REAL message id; ignore optimistic tmp-* ids so the server
        // cursor doesn't fall back to "return everything" and cause duplicates.
        let lastRealId: string | null = null;
        for (let i = messages.length - 1; i >= 0; i--) {
          if (!messages[i].id.startsWith("tmp-")) {
            lastRealId = messages[i].id;
            break;
          }
        }
        const res = await historyFn({
          data: { sessionId, afterId: lastRealId ?? undefined },
        });
        if (cancelled) return;
        if (res.messages.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            // Drop optimistic tmp-* user messages that now exist in the
            // incoming batch with the same content.
            const incomingUserContent = new Set(
              res.messages.filter((m) => m.role === "user").map((m) => m.content),
            );
            const next = prev.filter(
              (m) =>
                !(m.id.startsWith("tmp-") && m.role === "user" && incomingUserContent.has(m.content)),
            );
            for (const m of res.messages) if (!ids.has(m.id)) next.push(m as Msg);
            return next;
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
    pollRef.current = window.setInterval(load, 2500);
    return () => {
      cancelled = true;
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent) return;
    setStarting(true);
    try {
      const res = await startFn({
        data: { name: form.name, phone: form.phone, consent: true },
      });
      try {
        localStorage.setItem(STORAGE_KEY, res.sessionId);
      } catch {}
      setSessionId(res.sessionId);
      setMessages([]);
    } catch (err) {
      console.error(err);
      toast.error("Не удалось начать чат. Проверьте данные.");
    } finally {
      setStarting(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !pendingImage) || !sessionId || sending) return;
    setSending(true);
    setInput("");
    const imageUrl = pendingImage;
    setPendingImage(null);
    // optimistic
    setMessages((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        role: "user",
        content: imageUrl ? `![image](${imageUrl})${text ? `\n${text}` : ""}` : text,
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      await sendFn({ data: { sessionId, content: text, imageUrl: imageUrl ?? null } });
    } catch (err) {
      console.error(err);
      toast.error("Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Можно загружать только изображения");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Максимальный размер — 5 МБ");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `chat/${sessionId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("chat-uploads")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("chat-uploads").getPublicUrl(path);
      setPendingImage(data.publicUrl);
    } catch (err) {
      console.error(err);
      toast.error("Не удалось загрузить картинку");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Открыть чат"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition hover:scale-105 hover:shadow-primary/40"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[600px] max-h-[calc(100vh-2.5rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">AI-консультант</div>
                <div className="text-[11px] text-muted-foreground">tomsk.ai</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Закрыть"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!sessionId ? (
            <form onSubmit={handleStart} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground">
                Чтобы начать диалог, представьтесь — это нужно, чтобы мы могли с вами связаться.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="chat-name">Имя</Label>
                <Input
                  id="chat-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Иван"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="chat-phone">Телефон</Label>
                <Input
                  id="chat-phone"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+7 999 123-45-67"
                />
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="chat-consent"
                  checked={form.consent}
                  onCheckedChange={(v) => setForm({ ...form, consent: v === true })}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="chat-consent"
                  className="text-xs font-normal leading-relaxed text-muted-foreground"
                >
                  Я согласен с{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-foreground"
                  >
                    политикой конфиденциальности
                  </a>
                </Label>
              </div>
              <Button type="submit" disabled={!form.consent || starting} className="mt-auto">
                {starting ? "Подключаем…" : "Начать чат"}
              </Button>
            </form>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {messages.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground">Загрузка…</div>
                )}
              </div>
              <form onSubmit={handleSend} className="border-t border-border bg-background/60 p-3">
                {pendingImage && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                    <img src={pendingImage} alt="вложение" className="h-12 w-12 rounded object-cover" />
                    <div className="flex-1 text-xs text-muted-foreground">Картинка прикреплена</div>
                    <button
                      type="button"
                      onClick={() => setPendingImage(null)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Убрать"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading || !!pendingImage}
                    aria-label="Прикрепить картинку"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </Button>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e as unknown as React.FormEvent);
                      }
                    }}
                    placeholder="Напишите сообщение…"
                    rows={1}
                    className="min-h-[40px] max-h-32 resize-none"
                  />
                  <Button type="submit" size="icon" disabled={sending || (!input.trim() && !pendingImage)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: Msg }) {
  const isUser = message.role === "user";
  const isAdmin = message.role === "admin";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? "bg-primary text-primary-foreground"
            : isAdmin
              ? "bg-amber-500/15 border border-amber-500/30 text-foreground"
              : "bg-muted text-foreground"
        }`}
      >
        {isAdmin && (
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Администратор
          </div>
        )}
        {message.content}
      </div>
    </div>
  );
}