import { describe, expect, test } from "vitest";
import { newsInputSchema, parseNewsFormData, toParisInstant } from "../news-input";

const content = { type: "doc" as const, content: [{ type: "paragraph" as const }] };

describe("toParisInstant", () => {
  test("converts winter and summer browser values without using the host timezone", () => {
    expect(toParisInstant("2026-01-15T10:30")).toBe("2026-01-15T09:30:00Z");
    expect(toParisInstant("2026-07-15T10:30")).toBe("2026-07-15T08:30:00Z");
  });

  test.each(["2026-03-29T02:30", "2026-10-25T02:30"])(
    "rejects the ambiguous or nonexistent Paris time %s",
    (value) => expect(() => toParisInstant(value)).toThrow(),
  );

  test.each(["2026-01-15 10:30", "2026-01-15T10:30Z", "2026-1-5T1:30"])(
    "rejects a non datetime-local value %s",
    (value) => expect(() => toParisInstant(value)).toThrow(),
  );
});

describe("newsInputSchema", () => {
  test("accepts strict explicit-offset timestamps", () => {
    expect(
      newsInputSchema.parse({
        title: "Atelier cuisine",
        excerpt: "Un atelier ouvert aux adhérents.",
        content,
        startsAt: "2026-10-16T08:30:00+02:00",
        endsAt: "2026-10-16T10:30:00+02:00",
        featured: true,
      }),
    ).toMatchObject({ title: "Atelier cuisine", featured: true });
  });

  test.each(["2026-10-16", "2026-10-16T08:30:00", "Fri, 16 Oct 2026 08:30:00 GMT"])(
    "rejects a timestamp without an explicit ISO offset: %s",
    (startsAt) => {
      expect(
        newsInputSchema.safeParse({
          title: "Atelier",
          excerpt: "Description",
          content,
          startsAt,
          endsAt: null,
          featured: false,
        }).success,
      ).toBe(false);
    },
  );

  test.each([
    "2026-02-30T08:30:00+01:00",
    "2026-13-01T08:30:00+01:00",
  ])("rejects the impossible calendar timestamp %s", (startsAt) => {
    expect(
      newsInputSchema.safeParse({
        title: "Atelier",
        excerpt: "Description",
        content,
        startsAt,
        endsAt: null,
        featured: false,
      }).success,
    ).toBe(false);
  });

  test("requires title and excerpt and validates content", () => {
    const result = newsInputSchema.safeParse({
      title: "",
      excerpt: "",
      content: { type: "doc", content: [{ type: "image" }] },
      startsAt: "2026-10-16T12:00:00+02:00",
      endsAt: null,
      featured: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["title", "excerpt", "content"]),
      );
    }
  });

  test("requires the end to be at or after the start", () => {
    const result = newsInputSchema.safeParse({
      title: "Atelier",
      excerpt: "Description",
      content,
      startsAt: "2026-10-16T12:00:00+02:00",
      endsAt: "2026-10-16T11:00:00+02:00",
      featured: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["endsAt"]);
  });
});

describe("parseNewsFormData", () => {
  test("converts Europe/Paris browser values and checkbox state", () => {
    const formData = new FormData();
    formData.set("title", "Sortie culturelle");
    formData.set("excerpt", "Visite collective.");
    formData.set("content", JSON.stringify(content));
    formData.set("startsAt", "2026-07-15T10:30");
    formData.set("endsAt", "2026-07-15T12:00");
    formData.set("featured", "on");

    expect(parseNewsFormData(formData)).toEqual({
      success: true,
      data: expect.objectContaining({
        startsAt: "2026-07-15T08:30:00Z",
        endsAt: "2026-07-15T10:00:00Z",
        featured: true,
      }),
    });
  });

  test("returns French field errors for invalid local dates", () => {
    const formData = new FormData();
    formData.set("title", "Atelier");
    formData.set("excerpt", "Description");
    formData.set("content", JSON.stringify(content));
    formData.set("startsAt", "2026-03-29T02:30");
    formData.set("endsAt", "");

    expect(parseNewsFormData(formData)).toEqual({
      success: false,
      fieldErrors: { startsAt: [expect.any(String)] },
    });
  });
});
