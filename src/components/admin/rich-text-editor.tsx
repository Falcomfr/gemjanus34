"use client";

import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import {
  isSafeRichTextHref,
  serializeRichContent,
  stripPastedColors,
} from "@/lib/content/rich-content-schema";
import { EditorToolbar } from "./editor-toolbar";

type RichTextEditorProps = {
  initialContent: JSONContent;
  disabled?: boolean;
  describedBy?: string;
  invalid?: boolean;
  label?: string;
};

export function createRichTextExtensions() {
  return [
    StarterKit.configure({
      blockquote: false,
      code: false,
      codeBlock: false,
      heading: { levels: [2, 3] },
      horizontalRule: false,
      link: false,
      strike: false,
      underline: false,
    }),
    Link.configure({
      openOnClick: false,
      autolink: false,
      isAllowedUri: (url) => isSafeRichTextHref(url),
    }),
    Underline,
    TextStyle,
    Color,
  ];
}

export function RichTextEditor({
  initialContent,
  disabled = false,
  describedBy,
  invalid = false,
  label = "Contenu de la page",
}: RichTextEditorProps) {
  const [content, setContent] = useState(() => serializeRichContent(initialContent));
  const [serializationError, setSerializationError] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    content: initialContent,
    editorProps: {
      transformPastedHTML: stripPastedColors,
      attributes: {
        "aria-label": label,
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
      },
    },
    extensions: createRichTextExtensions(),
    onUpdate: ({ editor: currentEditor }) => {
      try {
        setContent(serializeRichContent(currentEditor.getJSON()));
        setSerializationError(false);
      } catch {
        // Never keep saving a stale value silently: an invalid value makes the save fail visibly.
        setContent("");
        setSerializationError(true);
      }
    },
  });

  useEffect(() => {
    editor?.setOptions({
      editorProps: {
        attributes: {
          "aria-label": label,
          ...(describedBy ? { "aria-describedby": describedBy } : {}),
          ...(invalid ? { "aria-invalid": "true" } : {}),
        },
      },
    });
  }, [describedBy, editor, invalid, label]);

  return (
    <div className={`rich-editor${disabled ? " rich-editor--disabled" : ""}`}>
      {editor && !disabled ? <EditorToolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
      {serializationError ? (
        <p className="editor-toolbar__error" role="alert">
          Une mise en forme collée n’est pas prise en charge. Collez le texte sans mise en forme
          (Ctrl+Maj+V) pour pouvoir enregistrer.
        </p>
      ) : null}
      <input type="hidden" name="content" value={content} />
    </div>
  );
}
