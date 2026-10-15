import { describe, expect, test } from "vitest";
import { richContentSchema, serializeRichContent } from "../rich-content-schema";

const validDocument = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Bienvenue" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Un texte " },
        {
          type: "text",
          text: "lié",
          marks: [
            { type: "bold" },
            { type: "italic" },
            { type: "underline" },
            { type: "link", attrs: { href: "https://janus34.fr/contact" } },
            { type: "textStyle", attrs: { color: "#185c4c" } },
          ],
        },
        { type: "hardBreak" },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Un" }] }],
        },
      ],
    },
    {
      type: "orderedList",
      attrs: { start: 2 },
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Deux" }] }],
        },
      ],
    },
  ],
};

describe("richContentSchema", () => {
  test("accepts the controlled Tiptap node and mark set", () => {
    expect(richContentSchema.safeParse(validDocument).success).toBe(true);
  });

  test.each(["script", "iframe", "image"])("rejects a %s node", (type) => {
    const document = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type }] }],
    };

    expect(richContentSchema.safeParse(document).success).toBe(false);
  });

  test("rejects heading level 1", () => {
    const document = {
      type: "doc",
      content: [{ type: "heading", attrs: { level: 1 }, content: [] }],
    };

    expect(richContentSchema.safeParse(document).success).toBe(false);
  });

  test("rejects javascript links", () => {
    const document = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "dangereux",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    };

    expect(richContentSchema.safeParse(document).success).toBe(false);
  });

  test.each(["#202521", "#185c4c", "#c84f3b", "#5b655f"])(
    "accepts the %s text color",
    (color) => {
      const document = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "couleur",
                marks: [{ type: "textStyle", attrs: { color } }],
              },
            ],
          },
        ],
      };

      expect(richContentSchema.safeParse(document).success).toBe(true);
    },
  );

  test("rejects a color outside the allowlist", () => {
    const document = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "couleur",
              marks: [{ type: "textStyle", attrs: { color: "#ffffff" } }],
            },
          ],
        },
      ],
    };

    expect(richContentSchema.safeParse(document).success).toBe(false);
  });

  test("serializes Tiptap ordered lists to the database schema", () => {
    const tiptapDocument = {
      type: "doc",
      content: [
        {
          type: "orderedList",
          attrs: { start: 1, type: null },
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Un" }] }],
            },
          ],
        },
      ],
    };

    const serialized = serializeRichContent(tiptapDocument);

    expect(JSON.parse(serialized)).toEqual({
      type: "doc",
      content: [
        {
          type: "orderedList",
          attrs: { start: 1 },
          content: tiptapDocument.content[0].content,
        },
      ],
    });
    expect(richContentSchema.safeParse(JSON.parse(serialized)).success).toBe(true);
  });
});
