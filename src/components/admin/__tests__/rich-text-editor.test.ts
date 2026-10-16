import { Editor } from "@tiptap/core";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, test } from "vitest";
import { serializeRichContent } from "@/lib/content/rich-content-schema";
import { createRichTextExtensions, RichTextEditor } from "../rich-text-editor";

describe("createRichTextExtensions", () => {
  test("excludes content nodes and marks outside the controlled schema", () => {
    const starterKit = createRichTextExtensions().find(
      (extension) => extension.name === "starterKit",
    );

    expect(starterKit?.options).toEqual(
      expect.objectContaining({
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
      }),
    );
  });

  test("serializes link attributes emitted by the configured editor", () => {
    const editor = new Editor({
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Janus34",
                marks: [{ type: "link", attrs: { href: "https://janus34.fr" } }],
              },
            ],
          },
        ],
      },
      extensions: createRichTextExtensions(),
    });

    try {
      const editorJson = editor.getJSON();
      const link = editorJson.content?.[0].content?.[0].marks?.[0];

      expect(link?.attrs).toEqual(expect.objectContaining({ title: null }));
      const serializedLink = JSON.parse(serializeRichContent(editorJson))
        .content[0].content[0].marks[0];
      expect(serializedLink.attrs).toEqual({
        href: "https://janus34.fr",
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        class: null,
      });
    } finally {
      editor.destroy();
    }
  });

  test("gives the editable surface an accessible name and error description", async () => {
    render(createElement(RichTextEditor, {
      initialContent: { type: "doc", content: [{ type: "paragraph" }] },
      label: "Contenu de la page",
      invalid: true,
      describedBy: "content-error",
    }));

    const editor = await screen.findByRole("textbox", { name: "Contenu de la page" });
    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(editor).toHaveAttribute("aria-describedby", "content-error");
  });
});
