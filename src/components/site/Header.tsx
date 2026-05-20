import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLeadDialog } from "@/lib/lead-dialog";

const NAV = [
  { to: "/catalog", label: "Решения" },
  { to: "/custom", label: "Индивидуально" },
  { to: "/contacts", label: "Контакты" },
] as const;

export function Header() {
  const open = useLeadDialog((s) => s.openDialog);
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background font-bold">
            T
          </span>
          <span className="text-base">tomsk.ai</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Button size="sm" onClick={() => open({ source: "header" })}>
          Обсудить проект
        </Button>
      </div>
    </header>
  );
}