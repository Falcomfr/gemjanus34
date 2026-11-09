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
  expect(!result.ok && result.problems).toHaveLength(2);
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
