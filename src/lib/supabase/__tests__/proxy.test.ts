import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ADMIN_PATHNAME_HEADER, updateSession } from "../proxy";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

describe("updateSession", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    vi.mocked(createServerClient).mockReset();
  });

  test("forwards refreshed cookies and the trusted pathname to Server Components", async () => {
    vi.mocked(createServerClient).mockImplementation((_url, _key, options) => ({
      auth: {
        getUser: async () => {
          options.cookies.setAll?.(
            [
              {
                name: "sb-session",
                value: "refreshed-token",
                options: { httpOnly: true, path: "/" },
              },
            ],
            {
              "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
              Expires: "0",
              Pragma: "no-cache",
            },
          );
          return { data: { user: null }, error: null };
        },
      },
    }) as never);

    const request = new NextRequest("https://gemjanus34.fr/admin/pages", {
      headers: { cookie: "existing=value" },
    });
    const response = await updateSession(request);

    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      "sb-session=refreshed-token",
    );
    expect(response.headers.get(`x-middleware-request-${ADMIN_PATHNAME_HEADER}`)).toBe(
      "/admin/pages",
    );
    expect(response.cookies.get("sb-session")?.value).toBe("refreshed-token");
    expect(response.headers.get("cache-control")).toContain("private");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
