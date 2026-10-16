"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseDocumentFormData, type DocumentField } from "@/lib/admin/document-input";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

export type DocumentActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: Partial<Record<DocumentField, string[]>>;
};

const BUCKET = "documents";

function revalidateDocumentPaths() {
  for (const path of ["/", "/actualites", "/qui-sommes-nous", "/activites", "/ressources", "/admin", "/admin/documents"]) {
    revalidatePath(path);
  }
}

function fileSlug(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "document"}-${Date.now().toString(36)}`;
}

export async function uploadDocument(
  _previousState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const profile = await requireProfile();
  const parsed = await parseDocumentFormData(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const { title, description, category, documentDate, file } = parsed.data;
  const supabase = await createServerClient();
  const bucket = supabase.storage.from(BUCKET);
  const path = `${category}/${fileSlug(title)}.pdf`;

  const upload = await bucket.upload(path, file, { contentType: "application/pdf" });
  if (upload.error) return { formError: "Le fichier n’a pas pu être envoyé. Réessayez." };

  const { error } = await supabase.from("documents").insert({
    title,
    description,
    category,
    document_date: documentDate,
    url: bucket.getPublicUrl(path).data.publicUrl,
    storage_path: path,
    created_by: profile.id,
  });

  if (error) {
    await bucket.remove([path]);
    return { formError: "Le document n’a pas pu être enregistré. Réessayez." };
  }

  revalidateDocumentPaths();
  return { success: `« ${title} » est en ligne.` };
}

const documentIdSchema = z.uuid();

export async function deleteDocument(
  _previousState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  await requireProfile();
  const id = documentIdSchema.safeParse(formData.get("documentId"));
  if (!id.success) return { formError: "Le document demandé est invalide." };

  const supabase = await createServerClient();
  const { data: existing, error: readError } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id.data)
    .single();
  if (readError || !existing) return { formError: "Le document demandé est introuvable." };

  const { error } = await supabase.from("documents").delete().eq("id", id.data);
  if (error) return { formError: "Le document n’a pas pu être supprimé." };

  // The row is gone, so the file is no longer listed; an orphaned file is harmless.
  if (existing.storage_path) await supabase.storage.from(BUCKET).remove([existing.storage_path]);

  revalidateDocumentPaths();
  return { success: "Document supprimé." };
}
