import { parsePageMedia } from "../page-media-input";

const jpeg = () => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2])], "photo.jpg", { type: "image/jpeg" });
const pdf = () => new File(["%PDF-1.7 contenu"], "compte-rendu.pdf", { type: "application/pdf" });

test("accepts a JPEG photo and names its type", async () => {
  expect(await parsePageMedia(jpeg(), "photo")).toEqual({ ok: true, extension: "jpg", contentType: "image/jpeg" });
});

test("accepts a PDF", async () => {
  expect(await parsePageMedia(pdf(), "pdf")).toEqual({ ok: true, extension: "pdf", contentType: "application/pdf" });
});

test("refuses a PDF sent as a photo, and a photo sent as a PDF", async () => {
  expect((await parsePageMedia(pdf(), "photo")).ok).toBe(false);
  expect((await parsePageMedia(jpeg(), "pdf")).ok).toBe(false);
});

test("refuses an empty or missing file", async () => {
  expect((await parsePageMedia(new File([], "vide.pdf"), "pdf")).ok).toBe(false);
  expect((await parsePageMedia(null, "pdf")).ok).toBe(false);
});

test("refuses a file over 4 MB", async () => {
  const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "gros.pdf");
  expect(await parsePageMedia(big, "pdf")).toEqual({ ok: false, error: "Le fichier dépasse 4 Mo." });
});
