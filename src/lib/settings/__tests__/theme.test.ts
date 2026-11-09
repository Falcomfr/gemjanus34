import { contrastRatio, defaultTheme, themeStyle, validateTheme } from "../theme";

test("measures contrast the WCAG way", () => {
  expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
});

test("the original colours are readable", () => {
  expect(validateTheme(defaultTheme)).toEqual({ ok: true });
});

test("refuses light text on a light background and names the pair", () => {
  const result = validateTheme({ ...defaultTheme, text: "#dddddd", background: "#ffffff" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.problems.join(" ")).toMatch(/texte/i);
});

test("refuses a green or a coral too light for white writing", () => {
  const result = validateTheme({ ...defaultTheme, forest: "#a8e6cf", coral: "#ffd0c0" });
  const problems = !result.ok ? result.problems.join(" ") : "";
  expect(problems).toMatch(/blanche n’est pas assez lisible sur le vert principal/);
  expect(problems).toMatch(/blanche n’est pas assez lisible sur le corail/);
});

test("keeps the original colours when there is no theme or a broken one", () => {
  expect(themeStyle(null)).toBeNull();
  expect(themeStyle({ ...defaultTheme, forest: "red" })).toBeNull();
  expect(themeStyle({ ...defaultTheme, text: "#dddddd", background: "#ffffff" })).toBeNull();
  expect(themeStyle("not an object")).toBeNull();
});

test("a custom theme sets the five colours and recomputes their shades", () => {
  const style = themeStyle({ ...defaultTheme, forest: "#123456" })!;

  expect(style).toMatch(/^:root:root\{/);
  expect(style).toContain("--forest:#123456;");
  expect(style).toContain("--forest-dark:color-mix(in srgb, var(--forest) 73%, black);");
  expect(style).toContain("--muted:color-mix(in srgb, var(--text) 78%, white);");
  expect(style).not.toMatch(/[<>]/);
});

test("refuses a dark theme whose text would vanish on the white cards and forms", () => {
  const result = validateTheme({ ...defaultTheme, background: "#121212", text: "#f0f0f0" });
  expect(!result.ok && result.problems.join(" ")).toMatch(/cartes/i);
});

test("refuses a text colour whose lighter shade, used for captions, becomes unreadable", () => {
  const result = validateTheme({ ...defaultTheme, text: "#767676", background: "#ffffff" });
  expect(!result.ok && result.problems.join(" ")).toMatch(/secondaire/i);
});

test("refuses a yellow too dark for the text and buttons written on it", () => {
  const result = validateTheme({ ...defaultTheme, sun: "#5a4a00" });
  expect(!result.ok && result.problems.join(" ")).toMatch(/jaune/i);
});

test("keeps the original shades in browsers without color-mix()", () => {
  const style = themeStyle({ ...defaultTheme, forest: "#123456" })!;
  const [base, shades] = style.split("@supports (color: color-mix(in srgb, red, red))");
  expect(base).toContain("--forest:#123456;");
  expect(base).not.toContain("color-mix");
  expect(shades).toContain("--forest-dark:color-mix(in srgb, var(--forest) 73%, black);");
});
