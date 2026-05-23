import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ShieldCheck, ShieldOff } from "lucide-react";
import {
  createUser,
  listUsers,
  setUserAdminRole,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const fetchList = useServerFn(listUsers);
  const callSetRole = useServerFn(setUserAdminRole);
  const callCreate = useServerFn(createUser);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchList(),
  });

  const roleMutation = useMutation({
    mutationFn: (vars: { userId: string; makeAdmin: boolean }) =>
      callSetRole({ data: vars }),
    onSuccess: () => {
      toast.success("Роли обновлены");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);

  const createMutation = useMutation({
    mutationFn: () => callCreate({ data: { email, password, makeAdmin } }),
    onSuccess: () => {
      toast.success("Пользователь создан");
      setOpen(false);
      setEmail("");
      setPassword("");
      setMakeAdmin(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Пользователи</h2>
          <p className="text-sm text-muted-foreground">
            Управляйте аккаунтами и правами администратора.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить пользователя
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый пользователь</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Пароль</Label>
                <Input
                  id="new-password"
                  type="text"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Минимум 6 символов. Передайте пароль пользователю.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <Label htmlFor="new-admin">Сделать администратором</Label>
                  <p className="text-xs text-muted-foreground">
                    Полный доступ к админ-панели.
                  </p>
                </div>
                <Switch
                  id="new-admin"
                  checked={makeAdmin}
                  onCheckedChange={setMakeAdmin}
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Создаём…" : "Создать"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Роли</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (users?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Пока нет пользователей.
                </TableCell>
              </TableRow>
            )}
            {users?.map((u) => {
              const isAdmin = u.roles.includes("admin");
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>
                    {u.confirmed ? (
                      <Badge variant="secondary">подтверждён</Badge>
                    ) : (
                      <Badge variant="outline">ожидает подтверждения</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Badge>admin</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">user</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={roleMutation.isPending}
                        onClick={() =>
                          roleMutation.mutate({ userId: u.id, makeAdmin: false })
                        }
                      >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Снять админа
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={roleMutation.isPending}
                        onClick={() =>
                          roleMutation.mutate({ userId: u.id, makeAdmin: true })
                        }
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Сделать админом
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}