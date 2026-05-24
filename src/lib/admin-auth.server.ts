import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function resolveAdminAccess(userId: string) {
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