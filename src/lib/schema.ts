import { z } from "zod";

export const leadSchema = z
  .object({
    name: z.string().trim().min(2, "Укажите имя").max(120),
    phone: z
      .string()
      .trim()
      .min(6, "Укажите телефон")
      .max(32, "Слишком длинный номер")
      .regex(/^[+\d][\d\s\-()]{5,}$/, "Некорректный телефон"),
    telegram: z.string().trim().max(120).optional().or(z.literal("")),
    email: z.string().trim().email("Некорректный email").max(255).optional().or(z.literal("")),
    message: z.string().trim().max(2000).optional().or(z.literal("")),
    product_id: z.string().uuid().nullable().optional(),
    source: z.string().max(50).default("site"),
    consent: z.literal(true, {
      message: "Нужно согласие с политикой конфиденциальности",
    }),
  });

export type LeadInput = z.infer<typeof leadSchema>;