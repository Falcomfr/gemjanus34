import { render, screen } from "@testing-library/react";
import { ContactForm } from "../contact-form";

test("prevents submission while secure delivery is unavailable", () => {
  const { container } = render(<ContactForm />);
  const form = container.querySelector("form");
  expect(form).not.toBeNull();

  const submit = new Event("submit", { bubbles: true, cancelable: true });
  form!.dispatchEvent(submit);

  expect(submit.defaultPrevented).toBe(true);
});

test("associates the message limits with the textarea", () => {
  render(<ContactForm />);

  const message = screen.getByRole("textbox", { name: "Message" });
  expect(message).toHaveAttribute("minlength", "20");
  expect(message).toHaveAttribute("maxlength", "5000");
  expect(message).toHaveAccessibleDescription("20 à 5 000 caractères.");
});

test("states plainly that no message can be sent yet", () => {
  render(<ContactForm />);

  expect(screen.getByRole("button", { name: "Envoyer le message" })).toBeDisabled();
  expect(screen.getByText(/aucun message ne peut être envoyé depuis cette page/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /04 67 04 87 68/ })).toHaveAttribute("href", "tel:+33467048768");
});
