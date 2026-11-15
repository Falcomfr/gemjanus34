import { beforeEach, expect, test, vi } from "vitest";
import * as galleryActions from "../actions";

const storage = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
  getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.test/gallery/${path}` } })),
}));
const table = vi.hoisted(() => ({ insert: vi.fn(), deleteResult: vi.fn(), selectResult: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/require-profile", () => ({
  requireProfile: vi.fn(async () => ({ id: "10000000-0000-0000-0000-000000000001", role: "editor" })),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    storage: { from: () => storage },
    from: () => ({
      insert: table.insert,
      select: () => ({ eq: () => ({ single: table.selectResult }) }),
      delete: () => ({ eq: table.deleteResult }),
    }),
  })),
}));

function uploadForm() {
  const data = new FormData();
  data.set("title", "Le phare");
  data.set("author", "Lou");
  data.set("workshop", "");
  data.set("consent", "on");
  data.set("file", new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1])], "phare.jpg", { type: "image/jpeg" }));
  return data;
}

beforeEach(() => vi.clearAllMocks());

test("stores the photo then lists the creation with its public address", async () => {
  storage.upload.mockResolvedValue({ error: null });
  table.insert.mockResolvedValue({ error: null });

  const state = await galleryActions.uploadGalleryItem({}, uploadForm());

  const [path, , options] = storage.upload.mock.calls[0]!;
  expect(path).toMatch(/^le-phare-[a-z0-9]+\.jpg$/);
  expect(options).toEqual({ contentType: "image/jpeg" });
  expect(table.insert).toHaveBeenCalledWith({
    kind: "image",
    title: "Le phare",
    author: "Lou",
    workshop: null,
    consent: true,
    image_path: path,
    image_url: `https://cdn.test/gallery/${path}`,
    created_by: "10000000-0000-0000-0000-000000000001",
  });
  expect(state.success).toBeDefined();
});

test("removes the photo again when the creation cannot be listed", async () => {
  storage.upload.mockResolvedValue({ error: null });
  table.insert.mockResolvedValue({ error: { message: "down" } });

  const state = await galleryActions.uploadGalleryItem({}, uploadForm());

  expect(storage.remove).toHaveBeenCalledWith([storage.upload.mock.calls[0]![0]]);
  expect(state.formError).toBeDefined();
});

test("erases the photo then removes the creation", async () => {
  table.selectResult.mockResolvedValue({ data: { image_path: "le-phare-x.jpg" }, error: null });
  table.deleteResult.mockResolvedValue({ error: null });
  storage.remove.mockResolvedValue({ error: null });
  const data = new FormData();
  data.set("itemId", "11111111-1111-4111-8111-111111111111");

  const state = await galleryActions.deleteGalleryItem({}, data);

  expect(table.deleteResult).toHaveBeenCalled();
  expect(storage.remove).toHaveBeenCalledWith(["le-phare-x.jpg"]);
  expect(state.success).toBeDefined();
});

test("keeps the creation listed when its photo cannot be erased, so the deletion can be retried", async () => {
  table.selectResult.mockResolvedValue({ data: { image_path: "le-phare-x.jpg" }, error: null });
  storage.remove.mockResolvedValue({ error: { message: "down" } });
  const data = new FormData();
  data.set("itemId", "11111111-1111-4111-8111-111111111111");

  const state = await galleryActions.deleteGalleryItem({}, data);

  expect(table.deleteResult).not.toHaveBeenCalled();
  expect(state.formError).toMatch(/photo/);
});

test("lists a pasted text without sending any file", async () => {
  table.insert.mockResolvedValue({ error: null });
  const data = uploadForm();
  data.set("kind", "text");
  data.set("body", "La mer\nau loin");
  data.delete("file");

  const state = await galleryActions.uploadGalleryItem({}, data);

  expect(storage.upload).not.toHaveBeenCalled();
  expect(table.insert).toHaveBeenCalledWith(expect.objectContaining({ kind: "text", body: "La mer\nau loin", image_path: null, image_url: null }));
  expect(state.success).toBeDefined();
});

test("stores a PDF writing as a PDF", async () => {
  storage.upload.mockResolvedValue({ error: null });
  table.insert.mockResolvedValue({ error: null });
  const data = uploadForm();
  data.set("kind", "pdf");
  data.set("file", new File(["%PDF-1.7 poème"], "recueil.pdf", { type: "application/pdf" }));

  await galleryActions.uploadGalleryItem({}, data);

  const [path, , options] = storage.upload.mock.calls[0]!;
  expect(path).toMatch(/\.pdf$/);
  expect(options).toEqual({ contentType: "application/pdf" });
  expect(table.insert).toHaveBeenCalledWith(expect.objectContaining({ kind: "pdf", image_path: path }));
});

test("removes a text without touching the storage", async () => {
  table.selectResult.mockResolvedValue({ data: { image_path: null }, error: null });
  table.deleteResult.mockResolvedValue({ error: null });
  const data = new FormData();
  data.set("itemId", "11111111-1111-4111-8111-111111111111");

  const state = await galleryActions.deleteGalleryItem({}, data);

  expect(storage.remove).not.toHaveBeenCalled();
  expect(table.deleteResult).toHaveBeenCalled();
  expect(state.success).toBeDefined();
});
