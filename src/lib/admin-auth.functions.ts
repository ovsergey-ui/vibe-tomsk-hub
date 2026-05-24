import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const verifyAdminLoginInput = z.object({
  userId: z.string().uuid(),
});

async function resolveAdminAccess(userId: string) {
  const { data: roleResult, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    throw new Error("Не удалось проверить права доступа");
  }

  return { isAdmin: Boolean(roleResult) };
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