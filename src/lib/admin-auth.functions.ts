import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "sergovinst@gmail.com";

const verifyAdminLoginInput = z.object({
  userId: z.string().uuid(),
});

async function resolveAdminAccess(userId: string) {
  const [{ data: userResult, error: userError }, { data: roleResult, error: roleError }] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(userId),
    supabaseAdmin.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle(),
  ]);

  if (userError) {
    throw new Error("Не удалось проверить администратора");
  }

  if (roleError) {
    throw new Error("Не удалось проверить права доступа");
  }

  const email = userResult.user?.email?.trim().toLowerCase() ?? "";

  return {
    isAdmin: email === ADMIN_EMAIL && Boolean(roleResult),
  };
}

export const verifyAdminLogin = createServerFn({ method: "POST" })
  .inputValidator((data) => verifyAdminLoginInput.parse(data))
  .handler(async ({ data }) => {
    return resolveAdminAccess(data.userId);
  });

export const getCurrentAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return resolveAdminAccess(context.userId);
  });