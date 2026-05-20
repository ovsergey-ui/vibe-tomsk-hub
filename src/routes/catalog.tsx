import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Каталог решений — tomsk.ai" },
      {
        name: "description",
        content: "Готовые AI-решения, Telegram-боты и автоматизация для бизнеса. Запуск от 3 дней.",
      },
      { property: "og:title", content: "Каталог решений — tomsk.ai" },
      { property: "og:description", content: "Готовые AI-решения и автоматизация для бизнеса." },
      { property: "og:url", content: "/catalog" },
    ],
    links: [{ rel: "canonical", href: "/catalog" }],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("slug,title,summary,price_from,timeline")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter((p) =>
    q.trim() ? (p.title + " " + p.summary).toLowerCase().includes(q.toLowerCase()) : true,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Каталог решений</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Готовые блоки, на которых мы запускаем проекты быстро. Любое решение можно адаптировать под вас.
      </p>
      <div className="mt-8 max-w-sm">
        <Input placeholder="Поиск по решениям…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
            ))
          : filtered.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
      {!isLoading && filtered.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">Ничего не нашли. Попробуйте другой запрос.</p>
      )}
    </div>
  );
}