import { z } from "zod";

export const leadSchema = z
  .object({
    name: z.string().trim().min(2, "Укажите имя").max(120),
    telegram: z.string().trim().max(120).optional().or(z.literal("")),
    email: z.string().trim().email("Некорректный email").max(255).optional().or(z.literal("")),
    message: z.string().trim().max(2000).optional().or(z.literal("")),
    product_id: z.string().uuid().nullable().optional(),
    source: z.string().max(50).default("site"),
  })
  .refine((v) => (v.telegram && v.telegram.length > 0) || (v.email && v.email.length > 0), {
    message: "Укажите Telegram или email",
    path: ["telegram"],
  });

export type LeadInput = z.infer<typeof leadSchema>;