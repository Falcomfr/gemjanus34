import { redirect } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { requireProfile, type ProfileClient } from "../require-profile";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

type ProfileRow = {
  id: string;
  display_name: string;
  role: "admin" | "editor";
  active: boolean;
  notify_on_publish: boolean;
};

function createClient(userId: string | null, profile: ProfileRow | null): ProfileClient {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    getActiveProfile: vi.fn().mockResolvedValue({ data: profile, error: null }),
  };
}

describe("requireProfile", () => {
  beforeEach(() => {
    vi.mocked(redirect).mockClear();
  });

  test("redirects an unauthenticated visitor to the admin login", async () => {
    const client = createClient(null, null);

    await expect(requireProfile(client)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/connexion",
    );
    expect(redirect).toHaveBeenCalledWith("/admin/connexion");
    expect(client.getActiveProfile).not.toHaveBeenCalled();
  });

  test("rejects an inactive profile", async () => {
    const client = createClient("user-1", null);

    await expect(requireProfile(client)).rejects.toThrow(
      "Profil administrateur inactif ou introuvable.",
    );
  });

  test.each(["editor", "admin"] as const)("returns an active %s profile", async (role) => {
    const client = createClient("user-1", {
      id: "user-1",
      display_name: "Camille Martin",
      role,
      active: true,
      notify_on_publish: role === "admin",
    });

    await expect(requireProfile(client)).resolves.toEqual({
      id: "user-1",
      displayName: "Camille Martin",
      role,
      notifyOnPublish: role === "admin",
    });
  });
});
