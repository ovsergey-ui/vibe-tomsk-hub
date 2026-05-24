import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Inbox, Package, EyeOff, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_panel/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const sevenAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [newLeads, totalLeads, activeProducts, hiddenProducts] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", sevenAgo),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", false),
      ]);
      return {
        newLeads: newLeads.count ?? 0,
        totalLeads: totalLeads.count ?? 0,
        activeProducts: activeProducts.count ?? 0,
        hiddenProducts: hiddenProducts.count ?? 0,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["admin-dashboard-recent-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id,name,phone,telegram,email,status,created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const metrics = [
    { label: "Новые за 7 дней", value: stats?.newLeads, icon: TrendingUp, accent: "text-primary" },
    { label: "Всего заявок", value: stats?.totalLeads, icon: Inbox, accent: "text-foreground" },
    { label: "Активных решений", value: stats?.activeProducts, icon: Package, accent: "text-emerald-500" },
    { label: "Скрытых решений", value: stats?.hiddenProducts, icon: EyeOff, accent: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Обзор</h2>
        <p className="mt-1 text-sm text-muted-foreground">Сводка по сайту за последние 7 дней.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur transition hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</span>
              <m.icon className={`h-4 w-4 ${m.accent}`} />
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">
              {m.value ?? "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold tracking-tight">Последние заявки</h3>
          <Link to="/leads" className="text-sm text-muted-foreground hover:text-foreground">
            Все заявки →
          </Link>
        </div>
        {(recent ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Пока нет заявок.</p>
        ) : (
          <div className="divide-y divide-border">
            {(recent ?? []).map((l: any) => (
              <div key={l.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.phone ?? l.telegram ?? l.email ?? "—"} · {new Date(l.created_at).toLocaleString("ru-RU")}
                  </div>
                </div>
                <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}