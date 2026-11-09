import { callbackSchema } from "../callback-schema";

const valid = { name: "Sam", phone: "06 12 34 56 78", preferredTime: "Le matin", consent: true, company: "" };

test("accepts French phone numbers written the usual ways", () => {
  for (const phone of ["06 12 34 56 78", "0612345678", "06.12.34.56.78", "+33 6 12 34 56 78"]) {
    expect(callbackSchema.safeParse({ ...valid, phone }).success).toBe(true);
  }
});

test("refuses a number too short to call back", () => {
  expect(callbackSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
  expect(callbackSchema.safeParse({ ...valid, phone: "appelez-moi" }).success).toBe(false);
});

test("the preferred time is optional and short", () => {
  expect(callbackSchema.safeParse({ ...valid, preferredTime: "" }).success).toBe(true);
  expect(callbackSchema.safeParse({ ...valid, preferredTime: "x".repeat(101) }).success).toBe(false);
});
