import { Editor } from "@tiptap/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { serializeRichContent } from "@/lib/content/rich-content-schema";
import { EditorToolbar } from "../editor-toolbar";
import { createRichTextExtensions } from "../rich-text-editor";

const upload = vi.fn();
vi.mock("@/app/admin/page-media-actions", () => ({ uploadPageMedia: (data: FormData) => upload(data) }));
// The browser resizes photos with a canvas, which jsdom lacks.
vi.mock("@/lib/admin/shrink-photo", () => ({ shrinkPhoto: async (file: File) => file }));

const storage = "https://x.supabase.co/storage/v1/object/public/page-media";

function setup() {
  const editor = new Editor({ content: { type: "doc", content: [{ type: "paragraph" }] }, extensions: createRichTextExtensions() });
  const view = render(<EditorToolbar editor={editor} />);
  const choose = (accept: string, file: File) =>
    fireEvent.change(view.container.querySelector(`input[type="file"][accept^="${accept}"]`)!, { target: { files: [file] } });
  return { editor, choose };
}

afterEach(() => {
  vi.restoreAllMocks();
  upload.mockReset();
});

test("shows the photo and PDF buttons", () => {
  setup();
  expect(screen.getByRole("button", { name: "Insérer une photo" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Joindre un PDF" })).toBeInTheDocument();
});

test("inserts an uploaded photo with its description", async () => {
  const { editor, choose } = setup();
  vi.spyOn(window, "prompt").mockReturnValue("Un atelier");
  upload.mockResolvedValue({ url: `${storage}/photo-abc.jpg` });

  choose("image", new File(["x"], "atelier.jpg", { type: "image/jpeg" }));

  await waitFor(() => expect(JSON.stringify(editor.getJSON())).toContain("photo-abc.jpg"));
  expect(upload.mock.calls[0][0].get("kind")).toBe("photo");
  const saved = JSON.parse(serializeRichContent(editor.getJSON()));
  expect(saved.content).toContainEqual({ type: "image", attrs: { src: `${storage}/photo-abc.jpg`, alt: "Un atelier" } });
});

test("sends nothing when the photo description is cancelled", async () => {
  const { choose } = setup();
  vi.spyOn(window, "prompt").mockReturnValue(null);

  choose("image", new File(["x"], "atelier.jpg", { type: "image/jpeg" }));

  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(upload).not.toHaveBeenCalled();
});

test("joins an uploaded PDF as a link named after its title", async () => {
  const { editor, choose } = setup();
  const prompt = vi.spyOn(window, "prompt").mockReturnValue("Compte rendu");
  upload.mockResolvedValue({ url: `${storage}/compte-rendu-x.pdf` });

  choose("application/pdf", new File(["%PDF-"], "compte-rendu-novembre.pdf", { type: "application/pdf" }));

  await waitFor(() => expect(JSON.stringify(editor.getJSON())).toContain("compte-rendu-x.pdf"));
  expect(prompt).toHaveBeenCalledWith(expect.any(String), "compte-rendu-novembre");
  expect(upload.mock.calls[0][0].get("title")).toBe("Compte rendu");
  expect(JSON.stringify(editor.getJSON())).toContain('"text":"Compte rendu"');
});

test("says why an upload failed and inserts nothing", async () => {
  const { editor, choose } = setup();
  vi.spyOn(window, "prompt").mockReturnValue("Compte rendu");
  upload.mockResolvedValue({ error: "Le fichier dépasse 4 Mo." });
  const before = editor.getJSON();

  choose("application/pdf", new File(["%PDF-"], "gros.pdf", { type: "application/pdf" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Le fichier dépasse 4 Mo.");
  expect(editor.getJSON()).toEqual(before);
});

test("ignores an image pasted from another site", () => {
  const editor = new Editor({ content: '<p>Texte</p><img src="https://example.com/a.jpg" alt="Ailleurs">', extensions: createRichTextExtensions() });
  expect(JSON.stringify(editor.getJSON())).not.toContain("example.com");
  editor.destroy();
});

test("keeps the photo when a PDF is joined right after it", async () => {
  const { editor, choose } = setup();
  vi.spyOn(window, "prompt").mockReturnValueOnce("Un atelier").mockReturnValueOnce("Compte rendu");
  upload.mockResolvedValueOnce({ url: `${storage}/photo-abc.jpg` }).mockResolvedValueOnce({ url: `${storage}/compte-rendu-x.pdf` });

  choose("image", new File(["x"], "atelier.jpg", { type: "image/jpeg" }));
  await waitFor(() => expect(JSON.stringify(editor.getJSON())).toContain("photo-abc.jpg"));
  choose("application/pdf", new File(["%PDF-"], "compte-rendu.pdf", { type: "application/pdf" }));
  await waitFor(() => expect(JSON.stringify(editor.getJSON())).toContain("compte-rendu-x.pdf"));

  expect(JSON.stringify(editor.getJSON())).toContain("photo-abc.jpg");
});

test("refuses a PDF over 4 MB before asking anything or sending it", async () => {
  const { choose } = setup();
  const prompt = vi.spyOn(window, "prompt");

  choose("application/pdf", new File([new Uint8Array(4 * 1024 * 1024 + 1)], "scan.pdf", { type: "application/pdf" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Le fichier dépasse 4 Mo.");
  expect(prompt).not.toHaveBeenCalled();
  expect(upload).not.toHaveBeenCalled();
});

test("keeps the sending status region mounted so screen readers announce it", () => {
  setup();
  expect(screen.getByRole("status")).toHaveTextContent("");
});
