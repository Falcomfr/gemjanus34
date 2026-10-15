import { describe, expect, test } from "vitest";
import { createRichTextExtensions } from "../rich-text-editor";

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
});
