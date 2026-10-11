import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(20).max(5000),
  consent: z.literal(true),
  company: z.literal(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
