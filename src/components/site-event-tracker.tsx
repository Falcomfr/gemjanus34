"use client";

import { useEffect } from "react";
import { isSiteEvent, type SiteEvent } from "@/lib/stats/site-events";

/** The counted gesture behind a click: a `data-stat` mark, or the kind of link. */
export function eventForClick(target: Element): SiteEvent | null {
  const marked = target.closest("[data-stat]")?.getAttribute("data-stat");
  if (marked) return isSiteEvent(marked) ? marked : null;
  const href = target.closest("a")?.getAttribute("href") ?? "";
  if (href.startsWith("tel:")) return "phone";
  if (/^https:\/\/www\.google\.[a-z.]+\/maps/.test(href)) return "map";
  if (/^https:\/\/([a-z-]+\.)?helloasso\.com\//.test(href)) return "helloasso";
  if (/\.pdf($|[?#])/i.test(href)) return "pdf";
  return null;
}

/** Counts a few public gestures as daily totals: no cookie, nothing about the visitor is sent. */
export function SiteEventTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (window.location.pathname.startsWith("/admin") || !(event.target instanceof Element)) return;
      const gesture = eventForClick(event.target);
      // sendBeacon survives the page leaving for a phone call or HelloAsso.
      if (gesture) navigator.sendBeacon?.("/api/stat", gesture);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
