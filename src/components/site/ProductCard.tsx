import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export type ProductCardData = {
  slug: string;
  title: string;
  summary: string;
  price_from: number;
  timeline: string;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight">{product.title}</h3>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.summary}</p>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
        <span className="font-medium text-foreground">от {product.price_from.toLocaleString("ru-RU")} ₽</span>
        <span className="text-muted-foreground">{product.timeline}</span>
      </div>
    </Link>
  );
}