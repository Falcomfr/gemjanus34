"use server";

import { parsePageMedia, type PageMediaKind } from "@/lib/admin/page-media-input";
import { requireProfile } from "@/lib/auth/require-profile";
import { createServerClient } from "@/lib/supabase/server";

const BUCKET = "page-media";

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Stores a photo or a PDF chosen in the page editor and gives back its public address. */
export async function uploadPageMedia(formData: FormData): Promise<{ url: string } | { error: string }> {
  await requireProfile();
  const kind: PageMediaKind = formData.get("kind") === "pdf" ? "pdf" : "photo";
  const file = formData.get("file");
  const checked = await parsePageMedia(file, kind);
  if (!checked.ok) return { error: checked.error };

  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const name = kind === "pdf" ? `${slug(String(formData.get("title") ?? "")) || "document"}-${stamp}` : `photo-${stamp}`;
  const path = `${name}.${checked.extension}`;

  // shortcut: a file later removed from its page stays in the bucket; add a cleanup if the storage quota gets close.
  const bucket = (await createServerClient()).storage.from(BUCKET);
  const upload = await bucket.upload(path, file as File, { contentType: checked.contentType });
  if (upload.error) return { error: "Le fichier n’a pas pu être envoyé. Réessayez." };
  return { url: bucket.getPublicUrl(path).data.publicUrl };
}
