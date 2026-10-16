import { z } from "zod";
import type { DocumentCategory } from "@/content/types";

export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

export const documentCategories = {
  planning: "Planning (ancien PDF, remplacé par la rubrique Planning)",
  institutional: "Association (statuts, règlement, comptes rendus)",
  health: "Santé et troubles bipolaires",
  activity: "Activités",
} as const satisfies Record<DocumentCategory, string>;

const fieldsSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(300),
  category: z.enum(Object.keys(documentCategories) as [DocumentCategory, ...DocumentCategory[]]),
  documentDate: z.iso.date(),
});

export type DocumentField = keyof z.infer<typeof fieldsSchema> | "file";
export type DocumentInput = z.infer<typeof fieldsSchema> & { file: File };
export type DocumentFormResult =
  | { success: true; data: DocumentInput }
  | { success: false; fieldErrors: Partial<Record<DocumentField, string[]>> };

const fieldMessages: Record<DocumentField, string> = {
  title: "Indiquez un titre de 160 caractères au plus.",
  description: "Indiquez une description de 300 caractères au plus.",
  category: "Choisissez une catégorie.",
  documentDate: "Indiquez la date du document.",
  file: "Choisissez un fichier PDF.",
};

async function fileError(value: FormDataEntryValue | null): Promise<string | null> {
  if (!(value instanceof File) || value.size === 0) return fieldMessages.file;
  if (value.size > MAX_DOCUMENT_BYTES) return "Le fichier dépasse 4 Mo.";
  // Check the PDF signature, not only the name or the browser-reported type.
  const signature = new TextDecoder().decode(await value.slice(0, 5).arrayBuffer());
  return signature === "%PDF-" ? null : fieldMessages.file;
}

export async function parseDocumentFormData(formData: FormData): Promise<DocumentFormResult> {
  const fields = fieldsSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "",
    documentDate: formData.get("documentDate") ?? "",
  });
  const fieldErrors: Partial<Record<DocumentField, string[]>> = {};

  if (!fields.success) {
    for (const issue of fields.error.issues) {
      const field = issue.path[0] as DocumentField;
      fieldErrors[field] = [fieldMessages[field]];
    }
  }

  const file = formData.get("file");
  const fileProblem = await fileError(file);
  if (fileProblem) fieldErrors.file = [fileProblem];

  if (!fields.success || fileProblem) return { success: false, fieldErrors };
  return { success: true, data: { ...fields.data, file: file as File } };
}
