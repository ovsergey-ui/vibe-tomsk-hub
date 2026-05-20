import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLeadDialog } from "@/lib/lead-dialog";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Решение — tomsk.ai` },
      { property: "og:url", content: `/products/${params.slug}` },
      { property: "og:type", content: "product" },
    ],
    links: [{ rel: "canonical", href: `/products/${params.slug}` }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const open = useLeadDialog((s) => s.openDialog);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: related } = useQuery({
    queryKey: ["related", product?.category_id, slug],
    enabled: !!product?.category_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("slug,title,summary,price_from,timeline")
        .eq("is_active", true)
        .eq("category_id", product!.category_id!)
        .neq("slug", slug)
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">Загрузка…</div>;
  }

  if (!product) {
    throw notFound();
  }

  const features = Array.isArray(product.features) ? (product.features as string[]) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Link to="/catalog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> К каталогу
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{product.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{product.summary}</p>
        <div className="mt-6 flex flex-wrap items-center gap-6 border-y border-border py-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Стоимость</div>
            <div className="mt-0.5 text-lg font-semibold">
              от {product.price_from.toLocaleString("ru-RU")} ₽
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Срок запуска</div>
            <div className="mt-0.5 text-lg font-semibold">{product.timeline || "обсуждаем"}</div>
          </div>
          <div className="ml-auto">
            <Button
              size="lg"
              onClick={() => open({ productId: product.id, productTitle: product.title, source: "product" })}
            >
              Оставить заявку
            </Button>
          </div>
        </div>
      </header>

      <section className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">О решении</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Что входит</h2>
          <ul className="mt-3 space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Как запускаем</h2>
        <ol className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
          {["Бриф", "Прототип", "Разработка", "Запуск"].map((t, i) => (
            <li key={t}>
              <div className="font-mono text-xs text-muted-foreground">0{i + 1}</div>
              <div className="mt-1 font-medium">{t}</div>
            </li>
          ))}
        </ol>
      </section>

      {related && related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-lg font-semibold tracking-tight">Похожие решения</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ProductCard key={r.slug} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}