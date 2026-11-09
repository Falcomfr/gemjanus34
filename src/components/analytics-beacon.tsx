"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import type { JSX } from "react";

/** Cloudflare Web Analytics: no cookie and nothing stored on the device, so no consent banner. */
export function AnalyticsBeacon({ token }: { token: string | undefined }): JSX.Element | null {
  const pathname = usePathname();
  if (!token || pathname.startsWith("/admin")) return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
      strategy="afterInteractive"
    />
  );
}
