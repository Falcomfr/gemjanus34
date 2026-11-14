import { isPdf, MAX_DOCUMENT_BYTES } from "./document-input";
import { imageKind } from "./gallery-input";

export type PageMediaKind = "photo" | "pdf";
export type PageMediaCheck = { ok: true; extension: string; contentType: string } | { ok: false; error: string };

/** A photo or a PDF inserted from the page editor, checked by its signature. */
export async function parsePageMedia(file: unknown, kind: PageMediaKind): Promise<PageMediaCheck> {
  const wrongType = kind === "photo" ? "Choisissez une photo JPEG, PNG ou WebP." : "Choisissez un fichier PDF.";
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: wrongType };
  if (file.size > MAX_DOCUMENT_BYTES) return { ok: false, error: "Le fichier dépasse 4 Mo." };
  if (kind === "pdf") return (await isPdf(file)) ? { ok: true, extension: "pdf", contentType: "application/pdf" } : { ok: false, error: wrongType };
  const image = await imageKind(file);
  return image ? { ok: true, ...image } : { ok: false, error: wrongType };
}
