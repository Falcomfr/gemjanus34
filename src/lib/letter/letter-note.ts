import { createServerClient } from "@/lib/supabase/server";

/** The note of the team for the weekly letter; empty when it cannot be read. */
export async function getLetterNote(): Promise<string> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase.from("weekly_letter").select("note").single();
    return data?.note ?? "";
  } catch {
    return "";
  }
}
