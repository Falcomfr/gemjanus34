import { beforeEach, expect, test, vi } from "vitest";
import * as messageActions from "../actions";

const update = vi.hoisted(() => vi.fn());
const remove = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/lib/auth/require-profile", () => ({
  requireProfile: vi.fn(async () => ({ id: "10000000-0000-0000-0000-000000000001", role: "editor" })),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: () => ({
      update: (values: unknown) => ({ eq: (column: string, id: string) => update(values, column, id) }),
      delete: () => ({ eq: remove }),
    }),
  })),
}));

const id = "30000000-0000-4000-8000-000000000001";
function form() {
  const data = new FormData();
  data.set("messageId", id);
  return data;
}

beforeEach(() => vi.clearAllMocks());

test("exports only async server actions", () => {
  for (const [name, value] of Object.entries(messageActions)) {
    expect(value.constructor.name, name).toBe("AsyncFunction");
  }
});

test("marks a message as handled by the current person", async () => {
  update.mockResolvedValue({ error: null });

  const state = await messageActions.markMessageHandled({}, form());

  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({ handled_by: "10000000-0000-0000-0000-000000000001", handled_at: expect.any(String) }),
    "id",
    id,
  );
  expect(state.success).toBeDefined();
});

test("deletes a message", async () => {
  remove.mockResolvedValue({ error: null });

  const state = await messageActions.deleteMessage({}, form());

  expect(remove).toHaveBeenCalledWith("id", id);
  expect(state.success).toBeDefined();
});

test("rejects an invalid message id", async () => {
  const data = new FormData();
  data.set("messageId", "pas-un-id");

  expect((await messageActions.deleteMessage({}, data)).formError).toBeDefined();
  expect(remove).not.toHaveBeenCalled();
});
