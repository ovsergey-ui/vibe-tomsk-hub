import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveAdminAccess } from "@/lib/admin-auth.server";

const verifyAdminLoginInput = z.object({
  userId: z.string().uuid(),
});

async function resolveAdminAccess(userId: string) {
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