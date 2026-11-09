import type { Database } from "@/lib/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrateur",
  manager: "Gestionnaire",
  editor: "Éditeur",
};

/** Publishes and corrects live content; site structure and accounts stay with administrators. */
export function canManageContent(role: AppRole): boolean {
  return role === "admin" || role === "manager";
}
