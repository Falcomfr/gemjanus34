import type { PublicDocument } from "@/content/types";
import { publicDateTimestamp } from "@/lib/date/public-date";

export function selectLatestDocument(
  documents: ReadonlyArray<PublicDocument>,
): PublicDocument | undefined {
  return documents.toSorted(
    (left, right) =>
      publicDateTimestamp(right.updatedAt) - publicDateTimestamp(left.updatedAt) ||
      left.id.localeCompare(right.id),
  )[0];
}
