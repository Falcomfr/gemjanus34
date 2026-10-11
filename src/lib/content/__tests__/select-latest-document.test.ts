import type { PublicDocument } from "@/content/types";

import { selectLatestDocument } from "../select-latest-document";

function createDocument(id: string, updatedAt: string): PublicDocument {
  return {
    id,
    title: id,
    slug: id,
    description: id,
    category: "planning",
    mimeType: "application/pdf",
    updatedAt,
    downloadUrl: `/documents/${id}`,
  };
}

test("selects the latest document by instant across differing offsets", () => {
  const lexicallyLaterButEarlier = createDocument(
    "offset-document",
    "2026-10-15T10:00:00+02:00",
  );
  const chronologicallyLater = createDocument("utc-document", "2026-10-15T09:00:00Z");

  expect(selectLatestDocument([lexicallyLaterButEarlier, chronologicallyLater])).toBe(
    chronologicallyLater,
  );
});

test("uses document ID as a deterministic tie-break for equal instants", () => {
  const laterId = createDocument("z-offset", "2026-10-15T10:00:00+02:00");
  const earlierId = createDocument("a-utc", "2026-10-15T08:00:00Z");

  expect(selectLatestDocument([laterId, earlierId])).toBe(earlierId);
});
