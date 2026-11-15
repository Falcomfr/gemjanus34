import { beforeEach, expect, test, vi } from "vitest";
import { POST } from "../route";

const rpc = vi.hoisted(() => vi.fn(async () => ({ error: null })));
vi.mock("@/lib/supabase/server", () => ({ createServerClient: vi.fn(async () => ({ rpc })) }));

const send = (body: string) => POST(new Request("http://localhost/api/stat", { method: "POST", body }));

beforeEach(() => rpc.mockClear());

test("counts a known gesture", async () => {
  const response = await send("phone");

  expect(response.status).toBe(204);
  expect(rpc).toHaveBeenCalledWith("count_site_event", { p_event: "phone" });
});

test("refuses anything else without touching the database", async () => {
  const response = await send("page_view");

  expect(response.status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
});
