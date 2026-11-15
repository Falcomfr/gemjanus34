/** Visitor gestures counted per day, without cookie or identifier. Same list as the SQL check. */
export const siteEvents = ["phone", "map", "pdf", "helloasso"] as const;
export type SiteEvent = (typeof siteEvents)[number];

export const siteEventLabels: Record<SiteEvent, string> = {
  phone: "Appels (clic sur le numéro)",
  map: "Carte et itinéraire",
  pdf: "Documents PDF ouverts ou imprimés",
  helloasso: "Adhésion et dons (HelloAsso)",
};

export function isSiteEvent(value: string): value is SiteEvent {
  return (siteEvents as readonly string[]).includes(value);
}
