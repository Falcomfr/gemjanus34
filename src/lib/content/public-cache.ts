import { revalidatePath } from "next/cache";

// Pages render per request (app/layout.tsx); this clears the client-side router cache so
// the person who made the change sees it on every page right away.
export function refreshPublicContent() {
  revalidatePath("/", "layout");
}
