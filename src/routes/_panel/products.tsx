import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { ImageUploader } from "@/components/admin/ImageUploader";

export const Route = createFileRoute("/_panel/products")({
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

function slugify(s: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return s.toLowerCase().split("").map((c) => map[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function AdminProductsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_desc");

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

  const toggleActive = async (p: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const filtered = useMemo(() => {
    let list = [...(products ?? [])];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category_id === categoryFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => (statusFilter === "active" ? p.is_active : !p.is_active));
    }
    switch (sortBy) {
      case "title": list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "price_asc": list.sort((a, b) => a.price_from - b.price_from); break;
      case "price_desc": list.sort((a, b) => b.price_from - a.price_from); break;
    }
    return list;
  }, [products, search, categoryFilter, statusFilter, sortBy]);

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
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <Input placeholder="Поиск по названию…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger><SelectValue placeholder="Категория" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="hidden">Скрытые</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created_desc">Сначала новые</SelectItem>
            <SelectItem value="title">По названию</SelectItem>
            <SelectItem value="price_asc">Цена ↑</SelectItem>
            <SelectItem value="price_desc">Цена ↓</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-14"></th>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Цена</th>
              <th className="px-4 py-3">Срок</th>
              <th className="px-4 py-3">Показ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  {p.cover_url ? (
                    <img src={p.cover_url} alt="" className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3">{p.price_from.toLocaleString("ru-RU")} ₽</td>
                <td className="px-4 py-3">{p.timeline}</td>
                <td className="px-4 py-3">
                  <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Ничего не найдено.
                </td>
              </tr>
            )}
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
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
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
        <Field label="Обложка">
          <ImageUploader
            value={form.cover_url}
            onChange={(url) => setForm({ ...form, cover_url: url })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Название">
            <Input
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((f) => ({
                  ...f,
                  title,
                  slug: slugTouched ? f.slug : slugify(title),
                }));
              }}
            />
          </Field>
          <Field label="Slug">
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
            />
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
        <Field label="Обложка (URL, необязательно)">
          <Input
            value={form.cover_url ?? ""}
            onChange={(e) => setForm({ ...form, cover_url: e.target.value || null })}
            placeholder="https://…"
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