import { parseGalleryFormData } from "../gallery-input";

const signatures = {
  jpeg: [0xff, 0xd8, 0xff, 0xe0],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  webp: [...new TextEncoder().encode("RIFF"), 0, 0, 0, 0, ...new TextEncoder().encode("WEBP")],
};
const image = (bytes: number[], name = "oeuvre.jpg", type = "image/jpeg") => new File([new Uint8Array([...bytes, 1, 2, 3])], name, { type });

function form(overrides: Record<string, string | File> = {}) {
  const data = new FormData();
  const values = { title: "Le phare", author: "Lou", workshop: "Linogravure", consent: "on", file: image(signatures.jpeg), ...overrides };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("accepts JPEG, PNG and WebP photos and names their type", async () => {
  for (const [kind, bytes] of Object.entries(signatures)) {
    const result = await parseGalleryFormData(form({ file: image(bytes, `oeuvre.${kind}`) }));
    expect(result.success && result.data.kind !== "text" && result.data.extension, kind).toBe(kind === "jpeg" ? "jpg" : kind);
  }
});

test("refuses a file that is not an image, whatever its name", async () => {
  const result = await parseGalleryFormData(form({ file: new File(["%PDF-1.7"], "oeuvre.jpg", { type: "image/jpeg" }) }));
  expect(result.success).toBe(false);
  if (!result.success) expect(result.fieldErrors.file).toBeDefined();
});

test("refuses a photo over 4 MB", async () => {
  const big = new File([new Uint8Array([...signatures.jpeg, ...new Uint8Array(4 * 1024 * 1024)])], "grande.jpg", { type: "image/jpeg" });
  const result = await parseGalleryFormData(form({ file: big }));
  expect(!result.success && result.fieldErrors.file?.[0]).toMatch(/4 Mo/);
});

test("refuses to publish without the author's consent", async () => {
  const data = form();
  data.delete("consent");
  const result = await parseGalleryFormData(data);
  expect(!result.success && result.fieldErrors.consent).toBeTruthy();
});

test("an empty author or workshop is stored as nothing", async () => {
  const result = await parseGalleryFormData(form({ author: "  ", workshop: "" }));
  expect(result.success && [result.data.author, result.data.workshop]).toEqual([null, null]);
});

test("a pasted text keeps its lines and needs no file", async () => {
  const data = form({ kind: "text", body: "  La mer\r\nau loin\r\n\r\nencore  " });
  data.delete("file");
  const result = await parseGalleryFormData(data);
  expect(result.success && result.data).toMatchObject({ kind: "text", body: "La mer\nau loin\n\nencore" });
});

test("refuses an empty or overlong text", async () => {
  for (const body of ["   ", "a".repeat(20001)]) {
    const result = await parseGalleryFormData(form({ kind: "text", body }));
    expect(!result.success && result.fieldErrors.body, body.slice(0, 5)).toBeTruthy();
  }
});

test("accepts a PDF writing and refuses a photo sent as a PDF", async () => {
  const pdf = await parseGalleryFormData(form({ kind: "pdf", file: new File(["%PDF-1.7 poème"], "recueil.pdf", { type: "application/pdf" }) }));
  expect(pdf.success && pdf.data).toMatchObject({ kind: "pdf", extension: "pdf", contentType: "application/pdf" });

  const photo = await parseGalleryFormData(form({ kind: "pdf" }));
  expect(!photo.success && photo.fieldErrors.file).toBeTruthy();
});
