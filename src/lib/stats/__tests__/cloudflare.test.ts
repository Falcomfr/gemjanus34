import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { getCloudflareStats } from "../cloudflare";

const env = { CLOUDFLARE_ACCOUNT_ID: "acc", CLOUDFLARE_API_TOKEN: "tok", CLOUDFLARE_WEB_ANALYTICS_SITE_TAG: "tag" };
const fetchMock = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-15T12:00:00Z"));
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const group = (count: number, visits: number, dimensions?: Record<string, string>, sampleInterval = 1) => ({ count, sum: { visits }, avg: { sampleInterval }, dimensions });

test("names the missing settings instead of calling Cloudflare", async () => {
  vi.stubEnv("CLOUDFLARE_API_TOKEN", "");

  expect(await getCloudflareStats()).toEqual({ status: "missing_config", missing: ["CLOUDFLARE_API_TOKEN"] });
  expect(fetchMock).not.toHaveBeenCalled();
});

test("reads the month, fills the quiet days and filters on the site tag", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { viewer: { accounts: [{
    total: [group(120, 80, undefined, 10)],
    series: [group(30, 20, { date: "2026-11-14" })],
    topPaths: [group(50, 40, { requestPath: "/planning" })],
    topReferers: [group(20, 15, { refererHost: "" })],
    topDevices: [group(90, 60, { deviceType: "mobile" })],
    recent: [group(35, 21)],
  }] } } })));

  const result = await getCloudflareStats();

  const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
  expect(JSON.stringify(body.variables.filter)).toContain('"siteTag":"tag"');
  expect(result.status).toBe("ok");
  if (result.status !== "ok") return;
  // Adaptive datasets are already scaled: the sample interval is never multiplied in.
  expect(result.data).toMatchObject({ pageViews: 120, visits: 80, recentVisits: 21, recentExact: true });
  expect(result.data.series).toHaveLength(30);
  expect(result.data.series.at(-2)).toEqual({ date: "2026-11-14", pageViews: 30, visits: 20 });
  expect(result.data.series.at(0)).toEqual({ date: "2026-10-17", pageViews: 0, visits: 0 });
  expect(result.data.topPaths).toEqual([{ label: "/planning", pageViews: 50, visits: 40 }]);
  expect(result.data.topReferers[0]!.label).toBe("Accès direct");
});

test("reports a refusal or a GraphQL error", async () => {
  fetchMock.mockResolvedValueOnce(new Response("no", { status: 403 }));
  expect(await getCloudflareStats()).toMatchObject({ status: "error" });

  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ errors: [{ message: "bad field" }] })));
  expect(await getCloudflareStats()).toEqual({ status: "error", message: "bad field" });
});
