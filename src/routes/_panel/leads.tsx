import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export const Route = createFileRoute("/_panel/leads")({
  component: AdminLeadsPage,
});

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Закрыта",
};

const PERIOD_DAYS: Record<string, number | null> = {
  all: null,
  today: 1,
  "7d": 7,
  "30d": 30,
};

function AdminLeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");
  const [active, setActive] = useState<any | null>(null);

  const { data: leads } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id,name,telegram,email,message,status,source,created_at,product_id,products(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) return toast.error("Не удалось обновить");
    toast.success("Статус обновлён");
    qc.invalidateQueries({ queryKey: ["admin-leads"] });
    qc.invalidateQueries({ queryKey: ["admin-leads-new-count"] });
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Скопировано");
  };

  const filtered = useMemo(() => {
    let list = [...(leads ?? [])];
    if (status !== "all") list = list.filter((l: any) => l.status === status);
    const days = PERIOD_DAYS[period];
    if (days) {
      const since = Date.now() - days * 24 * 60 * 60 * 1000;
      list = list.filter((l: any) => new Date(l.created_at).getTime() >= since);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l: any) =>
        [l.name, l.telegram, l.email, l.message].some((v) => v?.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [leads, search, status, period]);

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Заявки</h2>
      <p className="text-sm text-muted-foreground">Новые заявки от посетителей сайта.</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <Input placeholder="Поиск…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">За всё время</SelectItem>
            <SelectItem value="today">Сегодня</SelectItem>
            <SelectItem value="7d">7 дней</SelectItem>
            <SelectItem value="30d">30 дней</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center justify-end text-sm text-muted-foreground">
          Найдено: {filtered.length}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.map((l: any) => (
          <article
            key={l.id}
            className="cursor-pointer rounded-2xl border border-border bg-card p-5 transition hover:border-foreground/20"
            onClick={() => setActive(l)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {l.name}
                  {l.status === "new" && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                      Новая
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {l.telegram && <span>{l.telegram}</span>}
                  {l.email && <span>{l.email}</span>}
                  <span>{new Date(l.created_at).toLocaleString("ru-RU")}</span>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {l.products?.title && (
              <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                Решение: <span className="text-foreground">{l.products.title}</span>
              </div>
            )}
            {l.message && (
              <p className="mt-3 line-clamp-2 whitespace-pre-line text-sm text-foreground">{l.message}</p>
            )}
            <div className="mt-3 text-xs text-muted-foreground">Источник: {l.source}</div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            Ничего не найдено.
          </p>
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{active?.name}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-4 text-sm">
              <div className="text-xs text-muted-foreground">
                {new Date(active.created_at).toLocaleString("ru-RU")} · Источник: {active.source}
              </div>
              {active.telegram && (
                <Row label="Telegram" value={active.telegram} onCopy={copy} />
              )}
              {active.email && (
                <Row label="Email" value={active.email} onCopy={copy} />
              )}
              {active.products?.title && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Решение</div>
                  <div className="mt-1">{active.products.title}</div>
                </div>
              )}
              {active.message && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Сообщение</div>
                  <p className="mt-1 whitespace-pre-line">{active.message}</p>
                </div>
              )}
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Статус</div>
                <Select value={active.status} onValueChange={(v) => { updateStatus(active.id, v); setActive({ ...active, status: v }); }}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 break-all">{value}</div>
      </div>
      <Button size="icon" variant="ghost" onClick={() => onCopy(value)}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}