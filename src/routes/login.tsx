import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Вход и регистрация — tomsk.ai" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Не удалось войти. Проверьте email и пароль.");
      return;
    }
    toast.success("Вход выполнен");
    navigate({ to: "/" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Пароль должен быть не короче 6 символов.");
      return;
    }
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("registered")) {
        toast.error("Пользователь с таким email уже зарегистрирован.");
      } else {
        toast.error("Не удалось зарегистрироваться. Попробуйте ещё раз.");
      }
      return;
    }
    toast.success("Регистрация успешна. Проверьте почту для подтверждения.");
    setMode("signin");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "signin" ? "Вход" : "Регистрация"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "signin"
          ? "Войдите в свой аккаунт tomsk.ai."
          : "Создайте аккаунт, чтобы оставлять заявки и отслеживать их."}
      </p>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Вход</TabsTrigger>
          <TabsTrigger value="signup">Регистрация</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email-in">Email</Label>
              <Input id="email-in" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password-in">Пароль</Label>
              <Input
                id="password-in"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Входим…" : "Войти"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email-up">Email</Label>
              <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password-up">Пароль</Label>
              <Input
                id="password-up"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Минимум 6 символов.</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Создаём…" : "Зарегистрироваться"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Регистрируясь, вы соглашаетесь с{" "}
        <Link to="/offer" className="underline hover:text-foreground">офертой</Link>{" "}
        и{" "}
        <Link to="/privacy" className="underline hover:text-foreground">политикой конфиденциальности</Link>.
      </p>
    </div>
  );
}