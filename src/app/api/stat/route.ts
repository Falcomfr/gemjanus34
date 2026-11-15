import { isSiteEvent } from "@/lib/stats/site-events";
import { createServerClient } from "@/lib/supabase/server";

// shortcut: anyone can inflate a counter by posting here; harmless for internal totals, add a rate limit if they matter.
export async function POST(request: Request) {
  const event = (await request.text()).trim();
  if (!isSiteEvent(event)) return new Response(null, { status: 400 });

  const supabase = await createServerClient();
  // A lost count is not worth an error for the visitor's browser.
  await supabase.rpc("count_site_event", { p_event: event });
  return new Response(null, { status: 204 });
}
