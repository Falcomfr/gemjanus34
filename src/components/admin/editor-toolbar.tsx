"use client";

import type { CSSProperties } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { richTextColors } from "@/lib/content/rich-content-schema";

const colorLabels: Record<(typeof richTextColors)[number], string> = {
  "#202521": "Texte",
  "#185c4c": "Vert",
  "#c84f3b": "Corail",
  "#5b655f": "Gris",
};

type EditorToolbarProps = {
  editor: Editor;
};

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const heading = editor.isActive("heading", { level: 2 })
    ? "2"
    : editor.isActive("heading", { level: 3 })
      ? "3"
      : "paragraph";

  function editLink() {
    const currentHref = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Adresse du lien", currentHref ?? "https://");
    if (href === null) return;
    if (href.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Mise en forme du contenu">
      <div className="editor-toolbar__group">
        <button
          type="button"
          aria-label="Annuler"
          title="Annuler"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          <Undo2 aria-hidden="true" size={18} />
        </button>
        <button
          type="button"
          aria-label="Rétablir"
          title="Rétablir"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          <Redo2 aria-hidden="true" size={18} />
        </button>
      </div>

      <label className="editor-toolbar__heading">
        <span className="sr-only">Style de paragraphe</span>
        <select
          aria-label="Style de paragraphe"
          value={heading}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "2" || value === "3") {
              editor.chain().focus().setHeading({ level: Number(value) as 2 | 3 }).run();
            } else {
              editor.chain().focus().setParagraph().run();
            }
          }}
        >
          <option value="paragraph">Paragraphe</option>
          <option value="2">Titre 2</option>
          <option value="3">Titre 3</option>
        </select>
      </label>

      <div className="editor-toolbar__group">
        {[
          { label: "Gras", icon: Bold, active: "bold", command: () => editor.chain().focus().toggleBold().run() },
          { label: "Italique", icon: Italic, active: "italic", command: () => editor.chain().focus().toggleItalic().run() },
          { label: "Souligné", icon: UnderlineIcon, active: "underline", command: () => editor.chain().focus().toggleUnderline().run() },
        ].map(({ label, icon: Icon, active, command }) => (
          <button
            key={active}
            type="button"
            aria-label={label}
            aria-pressed={editor.isActive(active)}
            title={label}
            onClick={command}
          >
            <Icon aria-hidden="true" size={18} />
          </button>
        ))}
        <button
          type="button"
          aria-label="Lien"
          aria-pressed={editor.isActive("link")}
          title="Ajouter ou retirer un lien"
          onClick={editLink}
        >
          <Link2 aria-hidden="true" size={18} />
        </button>
      </div>

      <div className="editor-toolbar__group">
        <button
          type="button"
          aria-label="Liste à puces"
          aria-pressed={editor.isActive("bulletList")}
          title="Liste à puces"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List aria-hidden="true" size={18} />
        </button>
        <button
          type="button"
          aria-label="Liste numérotée"
          aria-pressed={editor.isActive("orderedList")}
          title="Liste numérotée"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered aria-hidden="true" size={18} />
        </button>
      </div>

      <div className="editor-toolbar__colors" aria-label="Couleur du texte">
        {richTextColors.map((color) => (
          <button
            key={color}
            type="button"
            className="editor-toolbar__swatch"
            aria-label={`Couleur ${colorLabels[color]}`}
            aria-pressed={editor.isActive("textStyle", { color })}
            title={colorLabels[color]}
            style={{ "--swatch-color": color } as CSSProperties}
            onClick={() => editor.chain().focus().setColor(color).run()}
          />
        ))}
      </div>
    </div>
  );
}
