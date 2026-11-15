import { describe, expect, test } from "vitest";
import {
  buildPageUpdate,
  pageInputSchema,
  parsePageFormData,
  type PageInput,
} from "../page-input";

const validInput: PageInput = {
  slug: "qui-sommes-nous",
  title: "Qui sommes-nous ?",
  summary: "Présentation de l’association.",
  content: { type: "doc", content: [{ type: "paragraph", content: [] }] },
  status: "draft",
  navigationPosition: 2,
  parentId: null,
};

describe("pageInputSchema", () => {
  test("accepts a valid page input", () => {
    expect(pageInputSchema.parse(validInput)).toEqual(validInput);
  });

  test.each(["Qui-Sommes-Nous", "qui sommes nous", "qui_sommes_nous"])(
    "rejects the invalid slug %s",
    (slug) => {
      expect(pageInputSchema.safeParse({ ...validInput, slug }).success).toBe(false);
    },
  );

  test.each(["review", "deleted", "PUBLISHED"])("rejects the invalid status %s", (status) => {
    expect(pageInputSchema.safeParse({ ...validInput, status }).success).toBe(false);
  });

  test("rejects invalid rich content", () => {
    expect(
      pageInputSchema.safeParse({
        ...validInput,
        content: { type: "doc", content: [{ type: "image", attrs: { src: "x" } }] },
      }).success,
    ).toBe(false);
  });

  test("allows optional navigation position and parent", () => {
    const result = pageInputSchema.parse({
      ...validInput,
      navigationPosition: null,
      parentId: "70a8fd6b-2aa8-4d66-aa02-b62566ae05d9",
    });

    expect(result.navigationPosition).toBeNull();
    expect(result.parentId).toBe("70a8fd6b-2aa8-4d66-aa02-b62566ae05d9");
  });

  test("defaults omitted structure fields to null", () => {
    const input = {
      slug: validInput.slug,
      title: validInput.title,
      summary: validInput.summary,
      content: validInput.content,
      status: validInput.status,
    };

    expect(pageInputSchema.parse(input)).toEqual({
      ...input,
      navigationPosition: null,
      parentId: null,
    });
  });

  test("parses JSON and nullable form fields", () => {
    const formData = new FormData();
    formData.set("slug", validInput.slug);
    formData.set("title", validInput.title);
    formData.set("summary", validInput.summary);
    formData.set("content", JSON.stringify(validInput.content));
    formData.set("status", validInput.status);
    formData.set("navigationPosition", "");
    formData.set("parentId", "");

    const result = parsePageFormData(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.navigationPosition).toBeNull();
      expect(result.data.parentId).toBeNull();
      expect(result.data.content).toEqual(validInput.content);
    }
  });

  test("returns French field errors for malformed form data", () => {
    const formData = new FormData();
    formData.set("slug", "Slug Incorrect");
    formData.set("title", "");
    formData.set("summary", "Résumé");
    formData.set("content", "{invalid");
    formData.set("status", "review");
    formData.set("navigationPosition", "deux");
    formData.set("parentId", "");

    const result = parsePageFormData(formData);

    expect(result).toEqual({
      success: false,
      fieldErrors: expect.objectContaining({
        slug: expect.any(Array),
        title: expect.any(Array),
        content: expect.any(Array),
        status: expect.any(Array),
        navigationPosition: expect.any(Array),
      }),
    });
  });
});

describe("buildPageUpdate", () => {
  const existing = {
    slug: "page-stable",
    status: "draft" as const,
    navigation_position: 4,
    parent_id: "70a8fd6b-2aa8-4d66-aa02-b62566ae05d9",
  };

  test("preserves lifecycle and structure fields for editors", () => {
    const update = buildPageUpdate("editor", { ...validInput, status: "archived" }, existing);

    expect(update).toEqual({
      title: validInput.title,
      summary: validInput.summary,
      content: validInput.content,
      slug: existing.slug,
      navigation_position: existing.navigation_position,
      parent_id: existing.parent_id,
      status: existing.status,
    });
  });

  test("allows administrators to update structure but preserves lifecycle", () => {
    const update = buildPageUpdate("admin", { ...validInput, status: "archived" }, existing);

    expect(update).toEqual({
      title: validInput.title,
      summary: validInput.summary,
      content: validInput.content,
      slug: validInput.slug,
      navigation_position: validInput.navigationPosition,
      parent_id: validInput.parentId,
      status: existing.status,
    });
  });
});

test.each(["admin", "contact", "actualites", "documents", "images", "nous-contacter", "evenements", "nos-objectifs-2", "le-trouble-bipolaire-2", "janus", "samedi", "sortir-a-montpellier", "mentions-legales-et-confidentialite"])(
  "refuses the reserved address %s, which a page could never use",
  (slug) => {
    const data = new FormData();
    data.set("slug", slug);
    data.set("title", "Titre");
    data.set("summary", "");
    data.set("content", JSON.stringify({ type: "doc", content: [] }));
    data.set("status", "draft");

    expect(parsePageFormData(data)).toEqual({
      success: false,
      fieldErrors: { slug: ["Cette adresse est réservée par le site. Choisissez-en une autre."] },
    });
  },
);
