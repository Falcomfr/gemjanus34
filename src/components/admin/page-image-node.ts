import { mergeAttributes, Node } from "@tiptap/core";

/** A photo uploaded from the editor. Only its own images are recognised on paste, never those of another site. */
export const PageImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, alt: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "img[data-page-media]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes, { "data-page-media": "" })];
  },
});
