import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import LoginPage from "../page";

vi.mock("../actions", () => ({
  login: vi.fn(async () => ({ error: "Adresse e-mail ou mot de passe incorrect." })),
}));

test("keeps the e-mail address after a wrong password", async () => {
  render(<LoginPage />);
  const email = screen.getByLabelText("Adresse e-mail") as HTMLInputElement;
  fireEvent.change(email, { target: { value: "admin@gemjanus34.local" } });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "mauvais" } });

  fireEvent.submit(email.form!);

  expect(await screen.findByRole("alert")).toHaveTextContent("incorrect");
  expect(email.value).toBe("admin@gemjanus34.local");
});
