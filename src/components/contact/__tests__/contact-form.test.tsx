import { render } from "@testing-library/react";
import { ContactForm } from "../contact-form";

test("prevents submission while secure delivery is unavailable", () => {
  const { container } = render(<ContactForm />);
  const form = container.querySelector("form");
  expect(form).not.toBeNull();

  const submit = new Event("submit", { bubbles: true, cancelable: true });
  form!.dispatchEvent(submit);

  expect(submit.defaultPrevented).toBe(true);
});
