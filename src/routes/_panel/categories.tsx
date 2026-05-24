import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";

export const Route = createFileRoute("/_panel/categories")({
  component: AdminCategoriesPage,
});

function slugify(s: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return s
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,title,slug")
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = async () => {
    const t = title.trim();
    if (!t) return;
    const { error } = await supabase
      .from("categories")
      .insert({ title: t, slug: slugify(t) });
    if (error) return toast.error(error.message);
    setTitle("");
    toast.success("Добавлено");
    qc.invalidateQueries({ queryKey: ["admin-categories-full"] });
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("categories")
      .update({ title: editing.title, slug: slugify(editing.title) })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    setEditing(null);
    toast.success("Сохранено");
    qc.invalidateQueries({ queryKey: ["admin-categories-full"] });
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const remove = async (id: string) => {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);
    if ((count ?? 0) > 0) {
      return toast.error(`Нельзя удалить: ${count} товаров в категории`);
    }
    if (!confirm("Удалить категорию?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["admin-categories-full"] });
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Категории</h2>
      <p className="text-sm text-muted-foreground">Группы решений для каталога.</p>

      <div className="mt-6 flex gap-2">
        <Input
          placeholder="Название категории"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add}>
          <Plus className="mr-1.5 h-4 w-4" /> Добавить
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(categories ?? []).map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  {editing?.id === c.id ? (
                    <Input
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    />
                  ) : (
                    <span className="font-medium">{c.title}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-right">
                  {editing?.id === c.id ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={saveEdit}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing({ id: c.id, title: c.title })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {categories && categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Пока нет категорий.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}