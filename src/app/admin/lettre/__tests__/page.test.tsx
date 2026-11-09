import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import AdminLetterPage from "../page";

vi.mock("@/lib/auth/require-profile", () => ({ requireProfile: vi.fn(async () => ({ id: "u1", role: "editor" })) }));
vi.mock("../actions", () => ({ saveLetterNote: vi.fn() }));
vi.mock("@/lib/letter/letter-note", () => ({ getLetterNote: vi.fn(async () => "Bonne semaine !") }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "gemjanus34.fr" }) }));

test("edits the note and prepares an e-mail with the link of the letter", async () => {
  render(await AdminLetterPage());

  expect(screen.getByLabelText(/mot de l’équipe/i)).toHaveValue("Bonne semaine !");
  expect(screen.getByRole("link", { name: /voir et imprimer/i })).toHaveAttribute("href", "/lettre");
  const mail = screen.getByRole("link", { name: /envoyer par e-mail/i });
  expect(mail.getAttribute("href")).toMatch(/^mailto:\?subject=/);
  expect(decodeURIComponent(mail.getAttribute("href")!)).toContain("https://gemjanus34.fr/lettre");
});
