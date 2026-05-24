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
import { Checkbox } from "@/components/ui/checkbox";
import { useLeadDialog } from "@/lib/lead-dialog";
import { leadSchema } from "@/lib/schema";
import { useServerFn } from "@tanstack/react-start";
import { submitLead } from "@/lib/leads.functions";

export function LeadDialog() {
  const { open, context, close } = useLeadDialog();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    telegram: "",
    email: "",
    message: "",
    consent: false,
  });
  const [error, setError] = useState<string | null>(null);
  const submitLeadFn = useServerFn(submitLead);

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
    try {
      await submitLeadFn({
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone,
          telegram: parsed.data.telegram || null,
          email: parsed.data.email || null,
          message: parsed.data.message || "",
          product_id: parsed.data.product_id ?? null,
          source: parsed.data.source,
        },
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
      toast.error("Не удалось отправить заявку. Попробуйте ещё раз.");
      return;
    }
    setLoading(false);
    toast.success("Заявка отправлена. Свяжемся в ближайшее время.");
    setForm({ name: "", phone: "", telegram: "", email: "", message: "", consent: false });
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">Имя *</Label>
              <Input
                id="lead-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Иван"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone">Телефон *</Label>
              <Input
                id="lead-phone"
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+7 999 123-45-67"
              />
            </div>
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
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="lead-consent"
              checked={form.consent}
              onCheckedChange={(v) => setForm({ ...form, consent: v === true })}
              className="mt-0.5"
            />
            <Label htmlFor="lead-consent" className="text-xs text-muted-foreground font-normal leading-relaxed cursor-pointer">
              Я согласен с{" "}
              <a href="/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2 text-foreground">
                политикой конфиденциальности
              </a>{" "}
              и обработкой персональных данных
            </Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !form.consent}>
            {loading ? "Отправляем…" : "Отправить заявку"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}