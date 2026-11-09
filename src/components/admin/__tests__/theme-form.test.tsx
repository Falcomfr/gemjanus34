import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { defaultTheme } from "@/lib/settings/theme";
import { ThemeForm } from "../theme-form";

vi.mock("@/app/admin/reglages/actions", () => ({ saveTheme: vi.fn(), resetTheme: vi.fn() }));

test("offers the five colours with the current values", () => {
  render(<ThemeForm theme={defaultTheme} custom={false} />);

  expect(screen.getByLabelText(/vert principal/i)).toHaveValue("#174f43");
  expect(screen.getByLabelText(/^texte/i)).toHaveValue("#1f2924");
  expect(screen.getAllByDisplayValue(/^#[0-9a-f]{6}$/)).toHaveLength(5);
});

test("previews a colour before it is saved, with its readability", () => {
  render(<ThemeForm theme={defaultTheme} custom={false} />);

  fireEvent.change(screen.getByLabelText(/^texte/i), { target: { value: "#eeeeee" } });

  expect(screen.getByTestId("theme-preview")).toHaveStyle({ "--text": "#eeeeee" });
  expect(screen.getByRole("alert")).toHaveTextContent(/texte n’est pas assez lisible/i);
});

test("offers to go back to the original colours only when they were changed", () => {
  const { unmount } = render(<ThemeForm theme={defaultTheme} custom={false} />);
  expect(screen.queryByRole("button", { name: /couleurs d’origine/i })).not.toBeInTheDocument();
  unmount();

  render(<ThemeForm theme={{ ...defaultTheme, forest: "#123456" }} custom />);
  expect(screen.getByRole("button", { name: /couleurs d’origine/i })).toBeInTheDocument();
});
