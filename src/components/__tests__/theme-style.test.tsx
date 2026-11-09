import { render } from "@testing-library/react";
import { defaultTheme } from "@/lib/settings/theme";
import { ThemeStyle } from "../theme-style";

test("adds no style while the site keeps its original colours", () => {
  const { container } = render(<ThemeStyle theme={null} />);
  expect(container.querySelector("style")).toBeNull();
});

test("applies a stored theme to the whole page", () => {
  const { container } = render(<ThemeStyle theme={{ ...defaultTheme, forest: "#123456" }} />);
  expect(container.querySelector("style")?.textContent).toContain("--forest:#123456;");
});
