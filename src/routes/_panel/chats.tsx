import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  listAdminChats,
  getAdminChatHistory,
  sendAdminMessage,
  closeChat,
  returnChatToBot,
} from "@/lib/chat.functions";

export const Route = createFileRoute("/_panel/chats")({
  component: AdminChatsPage,
});

const STATUS_LABELS: Record<string, string> = {
  bot: "Бот",
  escalated: "Тикет",
  closed: "Закрыт",
};

const STATUS_STYLES: Record<string, string> = {
  bot: "bg-muted text-muted-foreground border-border",
  escalated: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  closed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

type Session = {
  id: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
  last_message_at: string;
};

function AdminChatsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminChats);
  const historyFn = useServerFn(getAdminChatHistory);
  const sendFn = useServerFn(sendAdminMessage);
  const closeFn = useServerFn(closeChat);
  const returnFn = useServerFn(returnChatToBot);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: listData } = useQuery({
    queryKey: ["admin-chats"],
    queryFn: () => listFn(),
    refetchInterval: 5000,
  });

  const { data: chatData } = useQuery({
    queryKey: ["admin-chat", activeId],
    enabled: !!activeId,
    queryFn: () => historyFn({ data: { sessionId: activeId! } }),
    refetchInterval: 2500,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatData?.messages]);

  const sessions = (listData?.sessions ?? []) as Session[];

  const handleSend = async () => {
    const text = reply.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    try {
      await sendFn({ data: { sessionId: activeId, content: text } });
      setReply("");
      qc.invalidateQueries({ queryKey: ["admin-chat", activeId] });
      qc.invalidateQueries({ queryKey: ["admin-chats"] });
    } catch (err) {
      console.error(err);
      toast.error("Не удалось отправить");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!activeId) return;
    await closeFn({ data: { sessionId: activeId } });
    toast.success("Чат закрыт");
    qc.invalidateQueries({ queryKey: ["admin-chat", activeId] });
    qc.invalidateQueries({ queryKey: ["admin-chats"] });
  };

  const handleReturn = async () => {
    if (!activeId) return;
    await returnFn({ data: { sessionId: activeId } });
    toast.success("Возвращено боту");
    qc.invalidateQueries({ queryKey: ["admin-chat", activeId] });
    qc.invalidateQueries({ queryKey: ["admin-chats"] });
  };

  return (
    <div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Чаты</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Все диалоги клиентов с AI-консультантом. Тикеты — где клиент ждёт администратора.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`w-full rounded-2xl border p-3 text-left transition ${
                activeId === s.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card/60 hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium truncate">{s.name}</div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${STATUS_STYLES[s.status] ?? ""}`}
                >
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.phone}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {new Date(s.last_message_at).toLocaleString("ru-RU")}
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Пока нет чатов.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur">
          {!activeId || !chatData ? (
            <div className="flex h-[500px] items-center justify-center text-sm text-muted-foreground">
              Выберите чат слева
            </div>
          ) : (
            <div className="flex h-[600px] flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <div className="font-semibold">{chatData.session.name}</div>
                  <div className="text-xs text-muted-foreground">{chatData.session.phone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${STATUS_STYLES[chatData.session.status] ?? ""}`}
                  >
                    {STATUS_LABELS[chatData.session.status] ?? chatData.session.status}
                  </span>
                  {chatData.session.status !== "closed" && (
                    <>
                      {chatData.session.status === "escalated" && (
                        <Button size="sm" variant="outline" onClick={handleReturn}>
                          Вернуть боту
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={handleClose}>
                        Закрыть
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {chatData.messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
              </div>
              {chatData.session.status !== "closed" && (
                <div className="border-t border-border p-3">
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ответ клиенту…"
                      rows={2}
                      className="resize-none"
                    />
                    <Button onClick={handleSend} disabled={sending || !reply.trim()}>
                      Отправить
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    После вашего ответа бот замолкает в этом чате.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type Msg = { id: string; role: string; content: string; created_at: string };

function MessageBubble({ message }: { message: Msg }) {
  const isUser = message.role === "user";
  const isAdmin = message.role === "admin";
  const isAssistant = message.role === "assistant";
  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? "bg-muted text-foreground"
            : isAdmin
              ? "bg-amber-500/15 border border-amber-500/30 text-foreground"
              : isAssistant
                ? "bg-primary/10 border border-primary/20 text-foreground"
                : "bg-muted text-foreground"
        }`}
      >
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {isUser ? "Клиент" : isAdmin ? "Админ" : isAssistant ? "AI" : message.role}
        </div>
        {message.content}
        <div className="mt-1 text-[10px] text-muted-foreground/70">
          {new Date(message.created_at).toLocaleString("ru-RU")}
        </div>
      </div>
    </div>
  );
}