import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
            <Link to="/_panel/products" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Решения
            </Link>
            <Link to="/_panel/leads" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Заявки
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