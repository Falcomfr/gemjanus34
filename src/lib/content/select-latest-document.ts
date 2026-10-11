import type { PublicDocument } from "@/content/types";

export function selectLatestDocument(
  documents: ReadonlyArray<PublicDocument>,
): PublicDocument | undefined {
  return documents.toSorted(
    (left, right) =>
      right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id),
  )[0];
}
