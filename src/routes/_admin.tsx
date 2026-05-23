import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin")({
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) navigate({ to: "/login" });
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
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
    navigate({ to: "/login" });
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold tracking-tight">Админ-панель</h1>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/_admin/products" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Решения
            </Link>
            <Link to="/_admin/leads" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Заявки
            </Link>
            <Link to={"/_admin/users" as never} className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Пользователи
            </Link>
          </nav>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          Выйти
        </Button>
      </div>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}