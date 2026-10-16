import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ContactForm } from "../contact-form";

const sendContactMessage = vi.hoisted(() => vi.fn());

vi.mock("@/app/contact/actions", () => ({ sendContactMessage }));

function fill(container: HTMLElement) {
  fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Camille Martin" } });
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), { target: { value: "camille@example.test" } });
  fireEvent.change(screen.getByLabelText("Objet"), { target: { value: "Première visite" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
    target: { value: "Bonjour, je voudrais venir découvrir le GEM." },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  return container.querySelector("form")!;
}

test("associates the message limits with the textarea", () => {
  render(<ContactForm />);

  const message = screen.getByRole("textbox", { name: "Message" });
  expect(message).toHaveAttribute("minlength", "20");
  expect(message).toHaveAttribute("maxlength", "5000");
  expect(message).toHaveAccessibleDescription("20 à 5 000 caractères.");
});

test("sends the message and confirms only what the server confirmed", async () => {
  sendContactMessage.mockResolvedValue({ success: "Merci, votre message a bien été envoyé." });
  const { container } = render(<ContactForm />);

  fireEvent.submit(fill(container));

  expect(await screen.findByRole("status")).toHaveTextContent("bien été envoyé");
  expect((screen.getByLabelText("Nom") as HTMLInputElement).value).toBe("");
});

test("keeps the message typed when sending fails", async () => {
  sendContactMessage.mockResolvedValue({ formError: "Votre message n’a pas pu être envoyé." });
  const { container } = render(<ContactForm />);

  fireEvent.submit(fill(container));

  expect(await screen.findByRole("alert")).toHaveTextContent("n’a pas pu être envoyé");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect((screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement).value).toContain("découvrir le GEM");
});

test("shows field errors next to the fields", async () => {
  sendContactMessage.mockResolvedValue({ fieldErrors: { email: "Indiquez une adresse e-mail valide." } });
  const { container } = render(<ContactForm />);

  fireEvent.submit(fill(container));

  expect(await screen.findByText("Indiquez une adresse e-mail valide.")).toBeInTheDocument();
  expect(screen.getByLabelText("Adresse e-mail")).toHaveAttribute("aria-invalid", "true");
});
