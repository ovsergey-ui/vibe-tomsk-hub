import { createFileRoute } from "@tanstack/react-router";
import { Mail, Send, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadDialog } from "@/lib/lead-dialog";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Контакты — tomsk.ai" },
      { name: "description", content: "Свяжитесь с AI-студией tomsk.ai в Telegram или по email." },
      { property: "og:title", content: "Контакты — tomsk.ai" },
      { property: "og:url", content: "/contacts" },
    ],
    links: [{ rel: "canonical", href: "/contacts" }],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const open = useLeadDialog((s) => s.openDialog);
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Контакты</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Самый быстрый способ — Telegram. Отвечаем в рабочее время, обычно в течение часа.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <ContactCard icon={Send} title="Telegram" value="@tomskai" href="https://t.me/" />
        <ContactCard icon={Mail} title="Email" value="hello@tomsk.ai" href="mailto:hello@tomsk.ai" />
        <ContactCard icon={MapPin} title="Город" value="Томск, Россия" />
      </div>
      <div className="mt-10">
        <Button size="lg" onClick={() => open({ source: "contacts" })}>
          Оставить заявку
        </Button>
      </div>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  value,
  href,
}: {
  icon: typeof Mail;
  title: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    inner
  );
}