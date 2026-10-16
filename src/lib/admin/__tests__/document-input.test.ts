import { parseDocumentFormData } from "../document-input";

function pdf(bytes = "%PDF-1.7 contenu", name = "planning.pdf", type = "application/pdf") {
  return new File([bytes], name, { type });
}

function form(overrides: Record<string, string | File> = {}) {
  const data = new FormData();
  const values = {
    title: "Planning d'automne",
    description: "Le planning de la rentrée.",
    category: "planning",
    documentDate: "2026-10-20",
    file: pdf(),
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("accepts a complete PDF document", async () => {
  const result = await parseDocumentFormData(form());

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toMatchObject({
      title: "Planning d'automne",
      category: "planning",
      documentDate: "2026-10-20",
    });
    expect(result.data.file.name).toBe("planning.pdf");
  }
});

test("rejects a file that is not a PDF even with a .pdf name", async () => {
  const result = await parseDocumentFormData(form({ file: pdf("<html>", "faux.pdf") }));

  expect(result).toEqual({ success: false, fieldErrors: { file: ["Choisissez un fichier PDF."] } });
});

test("rejects files over 4 MB", async () => {
  const big = new File([new Uint8Array(4 * 1024 * 1024 + 1).fill(37)], "gros.pdf", { type: "application/pdf" });
  const result = await parseDocumentFormData(form({ file: big }));

  expect(result).toEqual({ success: false, fieldErrors: { file: ["Le fichier dépasse 4 Mo."] } });
});

test("requires a file, a title, a known category and a date", async () => {
  const result = await parseDocumentFormData(
    form({ file: new File([], ""), title: " ", category: "autre", documentDate: "20/10/2026" }),
  );

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(Object.keys(result.fieldErrors).sort()).toEqual(["category", "documentDate", "file", "title"]);
  }
});
