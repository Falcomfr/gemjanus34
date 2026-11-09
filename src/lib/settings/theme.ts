import { z } from "zod";
import { derivedTokens } from "./theme-tokens";

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

export const themeSchema = z.object({
  forest: hexColor,
  coral: hexColor,
  sun: hexColor,
  background: hexColor,
  text: hexColor,
});

export type Theme = z.infer<typeof themeSchema>;

/** The colours of globals.css. */
export const defaultTheme: Theme = { forest: "#174f43", coral: "#c84f3b", sun: "#f2c14e", background: "#fffdf8", text: "#1f2924" };

export const themeLabels: Record<keyof Theme, string> = {
  forest: "Vert principal (en-tête, boutons sombres)",
  coral: "Corail (boutons d’action)",
  sun: "Jaune (repères)",
  background: "Fond des pages",
  text: "Texte",
};

const MIN_CONTRAST = 4.5;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** WCAG contrast ratio, from 1 to 21. */
export function contrastRatio(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light! + 0.05) / (dark! + 0.05);
}

/** The colour that `color-mix(in srgb, <colour> <percent>%, <other>)` gives. */
function mix(colour: string, percent: number, other: "white" | "black"): string {
  const target = other === "white" ? 255 : 0;
  return `#${[1, 3, 5]
    .map((index) => Math.round((parseInt(colour.slice(index, index + 2), 16) * percent + target * (100 - percent)) / 100))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Every pair of colours the site writes one on the other, with the same mixes as theme-tokens.ts. */
export function validateTheme(theme: Theme): { ok: true } | { ok: false; problems: string[] } {
  const muted = mix(theme.text, 78, "white");
  const forestDark = mix(theme.forest, 73, "black");
  const pairs: Array<[string, string, string]> = [
    [theme.text, theme.background, "Le texte n’est pas assez lisible sur le fond"],
    [theme.text, "#ffffff", "Le texte n’est pas assez lisible sur les cartes et les formulaires, qui restent blancs"],
    [muted, theme.background, "Le texte secondaire (légendes, dates), plus clair que le texte, n’est pas assez lisible sur le fond"],
    ["#ffffff", theme.forest, "L’écriture blanche n’est pas assez lisible sur le vert principal"],
    ["#ffffff", theme.coral, "L’écriture blanche n’est pas assez lisible sur le corail"],
    [theme.text, theme.sun, "Le texte n’est pas assez lisible sur le jaune"],
    [forestDark, theme.sun, "Le vert foncé des boutons n’est pas assez lisible sur le jaune"],
  ];
  const problems = pairs
    .map(([front, back, message]) => [message, contrastRatio(front, back)] as const)
    .filter(([, ratio]) => ratio < MIN_CONTRAST)
    .map(([message, ratio]) => `${message} (contraste ${ratio.toFixed(1)} pour 4,5 au moins).`);
  return problems.length ? { ok: false, problems } : { ok: true };
}

/**
 * CSS that applies a stored theme, or null to keep the original colours.
 * Only #rrggbb values reach the stylesheet, so nothing can break out of the <style> tag.
 */
export function themeStyle(stored: unknown): string | null {
  const parsed = themeSchema.safeParse(stored);
  if (!parsed.success || !validateTheme(parsed.data).ok) return null;
  const base = Object.entries(parsed.data).map(([name, value]) => `--${name}:${value.toLowerCase()};`);
  const shades = derivedTokens.map(([token, from, other, percent]) => `${token}:color-mix(in srgb, var(--${from}) ${percent}%, ${other});`);
  // Doubled :root outweighs globals.css whatever the order of the stylesheets. Browsers without
  // color-mix() (iOS 15) keep the original shades instead of losing every button background.
  return `:root:root{${base.join("")}}@supports (color: color-mix(in srgb, red, red)){:root:root{${shades.join("")}}}`;
}
