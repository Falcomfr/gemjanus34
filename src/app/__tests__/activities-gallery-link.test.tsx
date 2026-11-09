import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import ActivitiesPage from "../activites/page";

const settings = vi.hoisted(() => ({ current: { galleryEnabled: true } }));
vi.mock("@/lib/settings/site-settings", () => ({ getSiteSettings: vi.fn(async () => settings.current) }));

test("points to the gallery once it is switched on", async () => {
  render(await ActivitiesPage());
  expect(screen.getByRole("link", { name: /galerie des créations/i })).toHaveAttribute("href", "/galerie");
});

test("says nothing of the gallery while it is off", async () => {
  settings.current = { galleryEnabled: false };
  render(await ActivitiesPage());
  expect(screen.queryByRole("link", { name: /galerie des créations/i })).not.toBeInTheDocument();
});
