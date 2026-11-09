import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { RegistrationForm } from "../registration-form";

vi.mock("@/app/conferences/actions", () => ({
  registerForConference: vi.fn(async () => ({ success: "Merci, votre inscription est enregistrée. À bientôt !" })),
}));

test("the person who takes the last seat keeps seeing their confirmation, not Complet", async () => {
  const { rerender } = render(<RegistrationForm conferenceId="c1" maxSeats={1} full={false} />);
  fireEvent.submit(screen.getByRole("button", { name: /m’inscrire/i }).closest("form")!);
  expect(await screen.findByText(/inscription est enregistrée/)).toBeInTheDocument();

  // The refreshed page now says the conference is full.
  rerender(<RegistrationForm conferenceId="c1" maxSeats={0} full />);
  expect(screen.getByText(/inscription est enregistrée/)).toBeInTheDocument();
  expect(screen.queryByText("Complet")).not.toBeInTheDocument();
});

test("a full conference shows Complet and no form", () => {
  render(<RegistrationForm conferenceId="c1" maxSeats={0} full />);
  expect(screen.getByText("Complet")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /m’inscrire/i })).not.toBeInTheDocument();
});

test("the consent says how long the registration is kept, as the privacy page does", () => {
  render(<RegistrationForm conferenceId="c1" maxSeats={4} full={false} />);
  expect(screen.getByLabelText(/3 mois après la conférence/)).toBeInTheDocument();
});
