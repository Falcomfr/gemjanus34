"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseGalleryFormData, type GalleryField } from "@/lib/admin/gallery-input";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

export type GalleryActionState = {
  success?: string;
  formError?: string;
  fieldErrors?: Partial<Record<GalleryField, string[]>>;
};

const BUCKET = "gallery";

function fileSlug(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "creation"}-${Date.now().toString(36)}`;
}

function refreshGallery() {
  revalidatePath("/galerie");
  revalidatePath("/admin/galerie");
}

export async function uploadGalleryItem(_previous: GalleryActionState, formData: FormData): Promise<GalleryActionState> {
  const profile = await requireProfile();
  const parsed = await parseGalleryFormData(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  const { title, author, workshop, file, extension, contentType } = parsed.data;
  const supabase = await createServerClient();
  const bucket = supabase.storage.from(BUCKET);
  const path = `${fileSlug(title)}.${extension}`;

  const upload = await bucket.upload(path, file, { contentType });
  if (upload.error) return { formError: "La photo n’a pas pu être envoyée. Réessayez." };

  const { error } = await supabase.from("gallery_items").insert({
    title,
    author,
    workshop,
    consent: true,
    image_path: path,
    image_url: bucket.getPublicUrl(path).data.publicUrl,
    created_by: profile.id,
  });
  if (error) {
    await bucket.remove([path]);
    return { formError: "La création n’a pas pu être enregistrée. Réessayez." };
  }

  refreshGallery();
  return { success: `« ${title} » est dans la galerie.` };
}

const itemIdSchema = z.uuid();

export async function deleteGalleryItem(_previous: GalleryActionState, formData: FormData): Promise<GalleryActionState> {
  await requireProfile();
  const id = itemIdSchema.safeParse(formData.get("itemId"));
  if (!id.success) return { formError: "La création demandée est invalide." };

  const supabase = await createServerClient();
  const { data: existing, error: readError } = await supabase.from("gallery_items").select("image_path").eq("id", id.data).single();
  if (readError || !existing) return { formError: "La création demandée est introuvable." };

  // The bucket is public: erase the photo first, so a withdrawn consent never leaves it online unnoticed.
  const removal = await supabase.storage.from(BUCKET).remove([existing.image_path]);
  if (removal.error) return { formError: "La photo n’a pas pu être effacée : la création reste en place, réessayez." };

  const { error } = await supabase.from("gallery_items").delete().eq("id", id.data);
  if (error) return { formError: "La photo est effacée mais la création n’a pas pu être retirée de la liste : réessayez." };

  refreshGallery();
  return { success: "Création retirée de la galerie." };
}
