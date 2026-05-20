import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLeadDialog } from "@/lib/lead-dialog";
import { leadSchema } from "@/lib/schema";
import { supabase } from "@/integrations/supabase/client";

export function LeadDialog() {
  const { open, context, close } = useLeadDialog();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", telegram: "", email: "", message: "" });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = leadSchema.safeParse({
      ...form,
      product_id: context.productId ?? null,
      source: context.source ?? "site",
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Проверьте данные");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.from("leads").insert({
      name: parsed.data.name,
      telegram: parsed.data.telegram || null,
      email: parsed.data.email || null,
      message: parsed.data.message || "",
      product_id: parsed.data.product_id ?? null,
      source: parsed.data.source,
    });
    setLoading(false);
    if (err) {
      toast.error("Не удалось отправить заявку. Попробуйте ещё раз.");
      return;
    }
    toast.success("Заявка отправлена. Свяжемся в ближайшее время.");
    setForm({ name: "", telegram: "", email: "", message: "" });
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Оставить заявку</DialogTitle>
          <DialogDescription>
            {context.productTitle
              ? `Решение: ${context.productTitle}. Напишем в течение рабочего дня.`
              : "Расскажите про задачу — напишем в Telegram или на email."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name">Имя</Label>
            <Input
              id="lead-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Иван"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lead-tg">Telegram</Label>
              <Input
                id="lead-tg"
                value={form.telegram}
                onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                placeholder="@username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.ru"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-msg">Задача</Label>
            <Textarea
              id="lead-msg"
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Коротко о задаче и контексте"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Отправляем…" : "Отправить заявку"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Отправляя форму, вы соглашаетесь с{" "}
            <a href="/privacy" className="underline underline-offset-2">политикой конфиденциальности</a>.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}