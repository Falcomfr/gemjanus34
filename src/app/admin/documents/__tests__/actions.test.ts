import { beforeEach, expect, test, vi } from "vitest";
import * as documentActions from "../actions";

const storage = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
  getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.test/documents/${path}` } })),
}));
const table = vi.hoisted(() => ({ insert: vi.fn(), deleteResult: vi.fn(), selectResult: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
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
  data.set("title", "Planning d'automne");
  data.set("description", "Le planning de la rentrée.");
  data.set("category", "planning");
  data.set("documentDate", "2026-10-20");
  data.set("file", new File(["%PDF-1.7"], "planning.pdf", { type: "application/pdf" }));
  return data;
}

beforeEach(() => vi.clearAllMocks());

test("exports only async server actions", () => {
  for (const [name, value] of Object.entries(documentActions)) {
    expect(value.constructor.name, name).toBe("AsyncFunction");
  }
});

test("stores the PDF then lists it with its public address", async () => {
  storage.upload.mockResolvedValue({ error: null });
  table.insert.mockResolvedValue({ error: null });

  const state = await documentActions.uploadDocument({}, uploadForm());

  const [path] = storage.upload.mock.calls[0]!;
  expect(path).toMatch(/^planning\/planning-d-automne-[a-z0-9]+\.pdf$/);
  expect(table.insert).toHaveBeenCalledWith(expect.objectContaining({
    title: "Planning d'automne",
    category: "planning",
    document_date: "2026-10-20",
    storage_path: path,
    url: `https://cdn.test/documents/${path}`,
  }));
  expect(state.success).toMatch(/en ligne/);
});

test("removes the stored file when the document cannot be recorded", async () => {
  storage.upload.mockResolvedValue({ error: null });
  table.insert.mockResolvedValue({ error: new Error("denied") });

  const state = await documentActions.uploadDocument({}, uploadForm());

  expect(storage.remove).toHaveBeenCalledWith([storage.upload.mock.calls[0]![0]]);
  expect(state.formError).toBeDefined();
  expect(state.success).toBeUndefined();
});

test("deletes the row and its stored file", async () => {
  table.selectResult.mockResolvedValue({ data: { storage_path: "planning/ancien.pdf" }, error: null });
  table.deleteResult.mockResolvedValue({ error: null });
  storage.remove.mockResolvedValue({ error: null });
  const data = new FormData();
  data.set("documentId", "20000000-0000-4000-8000-000000000001");

  const state = await documentActions.deleteDocument({}, data);

  expect(table.deleteResult).toHaveBeenCalledWith("id", "20000000-0000-4000-8000-000000000001");
  expect(storage.remove).toHaveBeenCalledWith(["planning/ancien.pdf"]);
  expect(state.success).toBeDefined();
});
