import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import StatisticsPage from "../page";

const role = vi.hoisted(() => ({ current: "admin" }));
const cloudflare = vi.hoisted(() => ({ current: { status: "missing_config", missing: ["CLOUDFLARE_API_TOKEN"] } as unknown }));
const tables: Record<string, unknown[]> = {
  contact_messages: [{ kind: "message", created_at: "2026-11-02T10:00:00Z", handled_at: null }],
  site_events: [{ day: "2026-11-14", event: "phone", count: 4 }],
  conferences: [{ id: "c1", title: "Le sommeil", starts_at: "2026-12-01T18:00:00Z", capacity: 40 }],
  planning_exceptions: [{ kind: "cancel", date: "2026-11-03" }],
  pages: [{ title: "Ressources", slug: "ressources", updated_at: "2026-01-01T00:00:00Z" }],
  audit_log: [{ actor_id: "u1", action: "page.publish", created_at: "2026-11-10T00:00:00Z" }],
  profiles: [{ id: "u1", display_name: "Mona" }],
  gallery_items: [{ kind: "text", workshop: "Écriture" }],
};

// Every query builder call returns the builder; awaiting it gives the table's rows.
function builder(rows: unknown[]): unknown {
  const result = { data: rows, error: null };
  return new Proxy({}, {
    get: (_target, key) => (key === "then" ? (resolve: (value: unknown) => void) => resolve(result) : () => builder(rows)),
  });
}

vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u1", role: role.current })) }));
vi.mock("@/lib/stats/cloudflare", () => ({ getCloudflareStats: vi.fn(async () => cloudflare.current) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    from: (table: string) => builder(tables[table] ?? []),
    rpc: () => builder([{ conference_id: "c1", seats: 10 }]),
  })),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-15T12:00:00Z"));
  role.current = "admin";
  cloudflare.current = { status: "missing_config", missing: ["CLOUDFLARE_API_TOKEN"] };
});

test("is reserved to administrators", async () => {
  role.current = "manager";
  render(await StatisticsPage());

  expect(screen.getByText(/réservées aux administrateurs/i)).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Messages" })).not.toBeInTheDocument();
});

test("shows every statistic the site already records", async () => {
  render(await StatisticsPage());

  expect(screen.getByRole("heading", { level: 1, name: "Statistiques" })).toBeInTheDocument();
  const gestures = screen.getByRole("region", { name: "Gestes des visiteurs" });
  expect(within(gestures).getByRole("row", { name: /appels/i })).toHaveTextContent("4");
  expect(screen.getByRole("region", { name: "Messages" })).toHaveTextContent("1 à traiter");
  expect(screen.getByRole("region", { name: "Conférences" })).toHaveTextContent("10 / 40");
  expect(screen.getByRole("region", { name: "Planning" })).toHaveTextContent("Annulées");
  const content = screen.getByRole("region", { name: "Pages à mettre à jour" });
  expect(within(content).getByRole("row", { name: /ressources/i })).toHaveTextContent("À revoir");
  expect(screen.getByRole("region", { name: "Activité de l’équipe" })).toHaveTextContent("Mona");
  expect(screen.getByRole("region", { name: "Galerie" })).toHaveTextContent("Écriture");
});

test("says which setting Cloudflare still needs", async () => {
  render(await StatisticsPage());

  expect(screen.getByRole("region", { name: "Visites du site" })).toHaveTextContent("CLOUDFLARE_API_TOKEN");
});

test("shows the visits once Cloudflare answers", async () => {
  cloudflare.current = {
    status: "ok",
    data: {
      pageViews: 300, visits: 120, periodDays: 30, recentVisits: 40, recentExact: true, recentDays: 7,
      series: [{ date: "2026-11-14", pageViews: 30, visits: 12 }],
      topPaths: [{ label: "/planning", pageViews: 90, visits: 50 }],
      topReferers: [{ label: "www.google.com", pageViews: 60, visits: 40 }],
      topDevices: [{ label: "mobile", pageViews: 200, visits: 80 }],
    },
  };
  render(await StatisticsPage());

  const visits = screen.getByRole("region", { name: "Visites du site" });
  expect(visits).toHaveTextContent("120");
  expect(visits).toHaveTextContent("/planning");
  expect(visits).toHaveTextContent("www.google.com");
  expect(visits).toHaveTextContent("Téléphone");
});
