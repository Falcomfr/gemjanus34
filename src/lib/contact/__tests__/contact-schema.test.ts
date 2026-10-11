import { contactSchema } from "../contact-schema";

test("accepts a complete contact request", () => {
  expect(
    contactSchema.safeParse({
      name: "Camille",
      email: "camille@example.fr",
      subject: "Première visite",
      message: "Bonjour, je souhaiterais convenir d'un rendez-vous.",
      consent: true,
      company: "",
    }).success,
  ).toBe(true);
});

test("rejects spam honeypot and missing consent", () => {
  expect(
    contactSchema.safeParse({
      name: "Robot",
      email: "robot@example.fr",
      subject: "Message",
      message: "Message suffisamment long",
      consent: false,
      company: "filled",
    }).success,
  ).toBe(false);
});
