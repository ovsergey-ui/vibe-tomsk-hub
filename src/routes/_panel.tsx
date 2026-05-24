import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAdminAccess } from "@/lib/admin-auth.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_panel")({
  head: () => ({
    meta: [
      { title: "Админ-панель — tomsk.ai" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  const { data: newLeadsCount } = useQuery({
    queryKey: ["admin-leads-new-count"],
    enabled: state === "ok",
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      return count ?? 0;
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) navigate({ to: "/admin" });
        return;
      }
      let data: { isAdmin: boolean } | null = null;
      let error: unknown = null;
      try {
        data = await getCurrentAdminAccess();
      } catch (err) {
        error = err;
      }
      if (cancelled) return;
      if (error || !data?.isAdmin) {
        setState("denied");
        return;
      }
      setState("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin" });
  };

  if (state === "loading") {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground sm:px-6">Проверяем доступ…</div>;
  }
  if (state === "denied") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight">Доступ закрыт</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          У этого аккаунта нет прав администратора.
        </p>
        <Button className="mt-6" variant="outline" onClick={signOut}>
          Выйти
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 px-5 py-3 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-6 overflow-x-auto">
            <h1 className="shrink-0 text-base font-semibold tracking-tight">
              <span className="text-primary">●</span> Админ
            </h1>
            <nav className="flex shrink-0 items-center gap-1 text-sm">
              <NavLink to="/dashboard">Обзор</NavLink>
              <NavLink to="/products">Решения</NavLink>
              <NavLink to="/categories">Категории</NavLink>
              <NavLink to="/leads">
                Заявки
                {newLeadsCount ? (
                  <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                    {newLeadsCount}
                  </span>
                ) : null}
              </NavLink>
            </nav>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="rounded-xl">
            Выйти
          </Button>
        </div>
        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center rounded-xl px-3 py-1.5 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
      activeProps={{ className: "bg-muted text-foreground" }}
      activeOptions={{ exact: to === "/dashboard" }}
    >
      {children}
    </Link>
  );
}