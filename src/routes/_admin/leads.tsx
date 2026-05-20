import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/leads")({
  component: AdminLeadsPage,
});

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Закрыта",
};

function AdminLeadsPage() {
  const qc = useQueryClient();
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
  };

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Заявки</h2>
      <p className="text-sm text-muted-foreground">Новые заявки от посетителей сайта.</p>
      <div className="mt-6 space-y-3">
        {(leads ?? []).map((l: any) => (
          <article key={l.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{l.name}</div>
                <div className="mt-0.5 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {l.telegram && <span>{l.telegram}</span>}
                  {l.email && <span>{l.email}</span>}
                  <span>{new Date(l.created_at).toLocaleString("ru-RU")}</span>
                </div>
              </div>
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
            {l.products?.title && (
              <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                Решение: <span className="text-foreground">{l.products.title}</span>
              </div>
            )}
            {l.message && (
              <p className="mt-3 whitespace-pre-line text-sm text-foreground">{l.message}</p>
            )}
            <div className="mt-3 text-xs text-muted-foreground">Источник: {l.source}</div>
          </article>
        ))}
        {leads && leads.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            Пока нет заявок.
          </p>
        )}
      </div>
    </div>
  );
}