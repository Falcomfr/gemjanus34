// Reduced from Clos Saint Conti's admin module, which runs in production with the same traps documented.
const ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
const PERIOD_DAYS = 30;
// Cloudflare keeps unsampled beacons for seven days: only this window is exact.
const RECENT_DAYS = 7;

type RumGroup = {
  count?: number | null;
  sum?: { visits?: number | null } | null;
  avg?: { sampleInterval?: number | null } | null;
  dimensions?: { date?: string; requestPath?: string; refererHost?: string; deviceType?: string } | null;
};
type Row = { label: string; pageViews: number; visits: number };

export type CloudflareStats = {
  pageViews: number;
  visits: number;
  periodDays: number;
  series: Array<{ date: string; pageViews: number; visits: number }>;
  topPaths: Row[];
  topReferers: Row[];
  topDevices: Row[];
  recentVisits: number | null;
  /** False when Cloudflare sampled even the short window: the number is then an estimate. */
  recentExact: boolean;
  recentDays: number;
};

export type CloudflareResult =
  | { status: "missing_config"; missing: string[] }
  | { status: "error"; message: string }
  | { status: "ok"; data: CloudflareStats };

// Never put a comment inside this string: Cloudflare's parser rejects accented `#` lines and the whole query fails.
const QUERY = `
  query JanusStats(
    $accountTag: string!
    $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!
    $recentFilter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        total: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 1) { count sum { visits } avg { sampleInterval } }
        series: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 31, orderBy: [date_ASC]) { count sum { visits } dimensions { date } }
        topPaths: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 8, orderBy: [count_DESC]) { count sum { visits } dimensions { requestPath } }
        topReferers: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 6, orderBy: [count_DESC]) { count sum { visits } dimensions { refererHost } }
        topDevices: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 4, orderBy: [count_DESC]) { count sum { visits } dimensions { deviceType } }
        recent: rumPageloadEventsAdaptiveGroups(filter: $recentFilter, limit: 1) { count sum { visits } avg { sampleInterval } }
      }
    }
  }
`;

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

// The site tag is what GraphQL filters on; the browser beacon token looks alike but would match no row.
function filter(siteTag: string, days: number) {
  return { AND: [{ datetime_geq: daysAgo(days).toISOString(), datetime_leq: new Date().toISOString() }, { bot: 0 }, { siteTag }] };
}

// Adaptive datasets already return scaled estimates: never multiply by sampleInterval.
const read = (group: RumGroup | undefined) => ({ pageViews: group?.count ?? 0, visits: group?.sum?.visits ?? 0 });

function rows(groups: RumGroup[] | undefined, key: "requestPath" | "refererHost" | "deviceType", fallback: string): Row[] {
  return (groups ?? []).map((group) => ({ label: group.dimensions?.[key] || fallback, ...read(group) })).filter((row) => row.pageViews > 0);
}

// Cloudflare only returns days with traffic: fill the others so the chart does not stretch two days over a month.
function fillSeries(groups: RumGroup[] | undefined) {
  const byDate = new Map((groups ?? []).filter((group) => group.dimensions?.date).map((group) => [group.dimensions!.date!, read(group)]));
  return Array.from({ length: PERIOD_DAYS }, (_, index) => {
    const date = daysAgo(PERIOD_DAYS - 1 - index).toISOString().slice(0, 10);
    return { date, ...(byDate.get(date) ?? { pageViews: 0, visits: 0 }) };
  });
}

export async function getCloudflareStats(): Promise<CloudflareResult> {
  const settings = {
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_WEB_ANALYTICS_SITE_TAG: process.env.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG,
  };
  const missing = Object.entries(settings).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length > 0) return { status: "missing_config", missing };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${settings.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          accountTag: settings.CLOUDFLARE_ACCOUNT_ID,
          filter: filter(settings.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG!, PERIOD_DAYS),
          recentFilter: filter(settings.CLOUDFLARE_WEB_ANALYTICS_SITE_TAG!, RECENT_DAYS),
        },
      }),
      cache: "no-store",
    });
    if (!response.ok) return { status: "error", message: `Cloudflare a répondu ${response.status}.` };

    const payload = (await response.json()) as {
      data?: { viewer?: { accounts?: Array<Record<string, RumGroup[] | undefined>> } };
      errors?: Array<{ message?: string }>;
    };
    if (payload.errors?.length) return { status: "error", message: payload.errors.map((error) => error.message).join(" ") };

    const account = payload.data?.viewer?.accounts?.[0] ?? {};
    const recent = account.recent?.[0];
    return {
      status: "ok",
      data: {
        ...read(account.total?.[0]),
        periodDays: PERIOD_DAYS,
        series: fillSeries(account.series),
        topPaths: rows(account.topPaths, "requestPath", "/"),
        topReferers: rows(account.topReferers, "refererHost", "Accès direct"),
        topDevices: rows(account.topDevices, "deviceType", "Non renseigné"),
        recentVisits: recent ? read(recent).visits : null,
        recentExact: (recent?.avg?.sampleInterval ?? 1) <= 1,
        recentDays: RECENT_DAYS,
      },
    };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Impossible de joindre Cloudflare." };
  }
}
