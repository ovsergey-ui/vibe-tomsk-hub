import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_admin/products")({
  component: AdminProductsPage,
});

type Product = {
  id: string;
  slug: string;
  title: string;
  price_from: number;
  category_id: string | null;
  summary: string;
  description: string;
  features: string[];
  timeline: string;
  cover_url: string | null;
  is_active: boolean;
};

const empty: Omit<Product, "id"> = {
  slug: "",
  title: "",
  price_from: 0,
  category_id: null,
  summary: "",
  description: "",
  features: [],
  timeline: "",
  cover_url: null,
  is_active: true,
};

function AdminProductsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,title").order("title");
      return data ?? [];
    },
  });

  const remove = async (id: string) => {
    if (!confirm("Удалить решение?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error("Не удалось удалить");
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Решения</h2>
          <p className="text-sm text-muted-foreground">Управляйте каталогом готовых решений.</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="mr-1.5 h-4 w-4" /> Добавить
            </Button>
          </DialogTrigger>
          <ProductForm
            initial={editing}
            categories={categories ?? []}
            onSaved={() => {
              setOpen(false);
              setEditing(null);
              qc.invalidateQueries({ queryKey: ["admin-products"] });
            }}
          />
        </Dialog>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Цена</th>
              <th className="px-4 py-3">Срок</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(products ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3">{p.price_from.toLocaleString("ru-RU")} ₽</td>
                <td className="px-4 py-3">{p.timeline}</td>
                <td className="px-4 py-3">
                  {p.is_active ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">активно</span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">скрыто</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductForm({
  initial,
  categories,
  onSaved,
}: {
  initial: Product | null;
  categories: { id: string; title: string }[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Omit<Product, "id">>(
    initial
      ? {
          slug: initial.slug,
          title: initial.title,
          price_from: initial.price_from,
          category_id: initial.category_id,
          summary: initial.summary,
          description: initial.description,
          features: initial.features ?? [],
          timeline: initial.timeline,
          cover_url: initial.cover_url,
          is_active: initial.is_active,
        }
      : { ...empty },
  );
  const [featuresText, setFeaturesText] = useState((initial?.features ?? []).join("\n"));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      features: featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
    };
    const { error } = initial
      ? await supabase.from("products").update(payload).eq("id", initial.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Сохранено");
    onSaved();
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{initial ? "Редактирование" : "Новое решение"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Название">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Slug">
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Цена от, ₽">
            <Input
              type="number"
              value={form.price_from}
              onChange={(e) => setForm({ ...form, price_from: Number(e.target.value) })}
            />
          </Field>
          <Field label="Срок">
            <Input value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} />
          </Field>
          <Field label="Категория">
            <Select
              value={form.category_id ?? ""}
              onValueChange={(v) => setForm({ ...form, category_id: v || null })}
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Краткое описание">
          <Textarea
            rows={2}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
        </Field>
        <Field label="Полное описание">
          <Textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Что входит (по пункту в строке)">
          <Textarea rows={4} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} />
        </Field>
        <Field label="Обложка (URL)">
          <Input
            value={form.cover_url ?? ""}
            onChange={(e) => setForm({ ...form, cover_url: e.target.value || null })}
          />
        </Field>
        <div className="flex items-center gap-3">
          <Switch
            checked={form.is_active}
            onCheckedChange={(v) => setForm({ ...form, is_active: v })}
          />
          <span className="text-sm">Показывать в каталоге</span>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}