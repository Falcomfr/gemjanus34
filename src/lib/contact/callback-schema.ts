import { z } from "zod";

// Same rule as the contact_messages_kind_fields check in the database.
export const callbackSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?[0-9][0-9 .]{8,18}[0-9]$/),
  preferredTime: z.string().trim().max(100),
  consent: z.literal(true),
  company: z.literal(""),
});

export type CallbackInput = z.infer<typeof callbackSchema>;
