import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfig } from "./config";

export const ADMIN_PATHNAME_HEADER = "x-janus-admin-pathname";

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseConfig();
  const createResponse = () => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(ADMIN_PATHNAME_HEADER, request.nextUrl.pathname);

    return NextResponse.next({ request: { headers: requestHeaders } });
  };

  let response = createResponse();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, responseHeaders) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = createResponse();
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(responseHeaders).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
