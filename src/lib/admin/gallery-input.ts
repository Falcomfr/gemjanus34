import { z } from "zod";
import { isPdf } from "./document-input";

export const MAX_GALLERY_BYTES = 4 * 1024 * 1024;

const optionalText = z.string().trim().max(80).transform((value) => value || null);

const fieldsSchema = z.object({
  title: z.string().trim().min(1).max(120),
  author: optionalText,
  workshop: optionalText,
  consent: z.literal(true),
});

export const MAX_GALLERY_TEXT = 20000;
export type GalleryKind = "image" | "text" | "pdf";
export type GalleryField = keyof z.infer<typeof fieldsSchema> | "file" | "body";
type ImageKind = { extension: "jpg" | "png" | "webp"; contentType: string };
type FileKind = { extension: "jpg" | "png" | "webp" | "pdf"; contentType: string };
export type GalleryInput = z.infer<typeof fieldsSchema> &
  ({ kind: "text"; body: string } | ({ kind: "image" | "pdf"; file: File } & FileKind));
export type GalleryFormResult =
  | { success: true; data: GalleryInput }
  | { success: false; fieldErrors: Partial<Record<GalleryField, string[]>> };

const fieldMessages: Record<GalleryField, string> = {
  title: "Indiquez un titre de 120 caractères au plus.",
  author: "80 caractères au plus.",
  workshop: "80 caractères au plus.",
  consent: "Cochez la case : une création n’est publiée qu’avec l’accord de son auteur.",
  file: "Choisissez une photo JPEG, PNG ou WebP.",
  body: `Collez le texte (${MAX_GALLERY_TEXT.toLocaleString("fr-FR")} caractères au plus).`,
};

// The file signature, not the name or the browser-reported type, says what the photo is.
export async function imageKind(file: File): Promise<ImageKind | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: "jpg", contentType: "image/jpeg" };
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return { extension: "png", contentType: "image/png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { extension: "webp", contentType: "image/webp" };
  return null;
}

export async function parseGalleryFormData(formData: FormData): Promise<GalleryFormResult> {
  const fields = fieldsSchema.safeParse({
    title: formData.get("title") ?? "",
    author: formData.get("author") ?? "",
    workshop: formData.get("workshop") ?? "",
    consent: formData.get("consent") === "on",
  });
  const fieldErrors: Partial<Record<GalleryField, string[]>> = {};
  if (!fields.success) {
    for (const issue of fields.error.issues) {
      const field = issue.path[0] as GalleryField;
      fieldErrors[field] = [fieldMessages[field]];
    }
  }

  const kind: GalleryKind = formData.get("kind") === "text" ? "text" : formData.get("kind") === "pdf" ? "pdf" : "image";
  if (kind === "text") {
    // Pasted from a word processor: Windows line ends become plain ones, the poem's own blank lines stay.
    const body = String(formData.get("body") ?? "").replace(/\r\n?/g, "\n").trim();
    if (!body || body.length > MAX_GALLERY_TEXT) fieldErrors.body = [fieldMessages.body];
    if (!fields.success || fieldErrors.body) return { success: false, fieldErrors };
    return { success: true, data: { ...fields.data, kind, body } };
  }

  const file = formData.get("file");
  const wrongType = kind === "pdf" ? "Choisissez un fichier PDF." : fieldMessages.file;
  let fileKind: FileKind | null = null;
  if (!(file instanceof File) || file.size === 0) fieldErrors.file = [wrongType];
  else if (file.size > MAX_GALLERY_BYTES) fieldErrors.file = ["Le fichier dépasse 4 Mo."];
  else if (kind === "pdf") fileKind = (await isPdf(file)) ? { extension: "pdf", contentType: "application/pdf" } : null;
  else fileKind = await imageKind(file);
  if (!fieldErrors.file && !fileKind) fieldErrors.file = [wrongType];

  if (!fields.success || !fileKind) return { success: false, fieldErrors };
  return { success: true, data: { ...fields.data, kind, file: file as File, ...fileKind } };
}
