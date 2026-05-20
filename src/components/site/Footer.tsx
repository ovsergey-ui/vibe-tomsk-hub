import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background text-sm font-bold">
              T
            </span>
            tomsk.ai
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            AI-студия в Томске. Telegram-боты, AI-инструменты и автоматизация под бизнес.
          </p>
        </div>
        <FooterCol title="Студия">
          <FooterLink to="/catalog">Решения</FooterLink>
          <FooterLink to="/custom">Индивидуальная разработка</FooterLink>
          <FooterLink to="/contacts">Контакты</FooterLink>
        </FooterCol>
        <FooterCol title="Документы">
          <FooterLink to="/privacy">Политика конфиденциальности</FooterLink>
          <FooterLink to="/offer">Публичная оферта</FooterLink>
        </FooterCol>
        <FooterCol title="Связь">
          <a className="text-sm text-muted-foreground hover:text-foreground" href="https://t.me/" target="_blank" rel="noreferrer">
            Telegram
          </a>
          <a className="text-sm text-muted-foreground hover:text-foreground" href="mailto:hello@tomsk.ai">
            hello@tomsk.ai
          </a>
          <span className="text-sm text-muted-foreground">Томск</span>
        </FooterCol>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6">
          <span>© {new Date().getFullYear()} tomsk.ai — AI-студия, г. Томск</span>
          <span>Сделано на Lovable</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
      {children}
    </Link>
  );
}