import { Editor } from "@tiptap/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { EditorToolbar } from "../editor-toolbar";
import { createRichTextExtensions } from "../rich-text-editor";

describe("EditorToolbar links", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("rejects a protocol outside the controlled schema without changing content", () => {
    const editor = new Editor({
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Appelez-nous" }],
          },
        ],
      },
      extensions: createRichTextExtensions(),
    });
    const contentBefore = editor.getJSON();
    vi.spyOn(window, "prompt").mockReturnValue("tel:+33412345678");

    try {
      render(<EditorToolbar editor={editor} />);
      fireEvent.click(screen.getByRole("button", { name: "Lien" }));

      expect(screen.getByRole("alert")).toHaveTextContent(
        "L’adresse du lien doit commencer par https://, http://, mailto:, / ou #.",
      );
      expect(editor.getJSON()).toEqual(contentBefore);
    } finally {
      editor.destroy();
    }
  });
});
