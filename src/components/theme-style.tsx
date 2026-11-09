import type { JSX } from "react";
import { themeStyle } from "@/lib/settings/theme";

export function ThemeStyle({ theme }: { theme: unknown }): JSX.Element | null {
  const css = themeStyle(theme);
  // themeStyle only lets #rrggbb values through, so the CSS cannot close the tag.
  return css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null;
}
