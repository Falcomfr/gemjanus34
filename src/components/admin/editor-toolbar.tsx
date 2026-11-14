"use client";

import { useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  FileText,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import {
  isSafeRichTextHref,
  richTextColors,
} from "@/lib/content/rich-content-schema";
import { uploadPageMedia } from "@/app/admin/page-media-actions";
import { shrinkPhoto } from "@/lib/admin/shrink-photo";

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
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const heading = editor.isActive("heading", { level: 2 })
    ? "2"
    : editor.isActive("heading", { level: 3 })
      ? "3"
      : "paragraph";

  function editLink() {
    const currentHref = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Adresse du lien", currentHref ?? "https://");
    if (href === null) return;
    const trimmedHref = href.trim();
    if (trimmedHref === "") {
      setError(null);
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!isSafeRichTextHref(trimmedHref)) {
      setError(
        "L’adresse du lien doit commencer par https://, http://, mailto:, / ou #.",
      );
      return;
    }
    setError(null);
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmedHref }).run();
  }

  async function insertMedia(kind: "photo" | "pdf", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const answer = kind === "photo"
      ? window.prompt("Décrivez la photo en une phrase (elle est lue aux personnes malvoyantes)")
      : window.prompt("Titre du document affiché sur la page", file.name.replace(/\.pdf$/i, ""));
    if (answer === null) return;
    const text = answer.trim().slice(0, 300);
    if (!text) {
      setError(kind === "photo" ? "La description de la photo est obligatoire." : "Le titre du document est obligatoire.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const data = new FormData();
      data.set("kind", kind);
      data.set("file", kind === "photo" ? new File([await shrinkPhoto(file)], "photo.jpg", { type: "image/jpeg" }) : file);
      if (kind === "pdf") data.set("title", text);
      const result = await uploadPageMedia(data);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      // An empty paragraph after the photo takes the cursor; otherwise the photo stays selected and the next insertion replaces it.
      editor.chain().focus().insertContent(
        kind === "photo"
          ? [{ type: "image", attrs: { src: result.url, alt: text } }, { type: "paragraph" }]
          : { type: "paragraph", content: [{ type: "text", text, marks: [{ type: "link", attrs: { href: result.url } }] }] },
      ).run();
    } catch {
      setError(kind === "photo"
        ? "Cette photo n’a pas pu être lue ou envoyée : essayez une photo JPEG, PNG ou WebP."
        : "Le fichier n’a pas pu être envoyé. Réessayez.");
    } finally {
      setSending(false);
    }
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

      <div className="editor-toolbar__group">
        <button
          type="button"
          aria-label="Insérer une photo"
          title="Insérer une photo"
          disabled={sending}
          onClick={() => photoInput.current?.click()}
        >
          <ImagePlus aria-hidden="true" size={18} />
        </button>
        <button
          type="button"
          aria-label="Joindre un PDF"
          title="Joindre un PDF"
          disabled={sending}
          onClick={() => pdfInput.current?.click()}
        >
          <FileText aria-hidden="true" size={18} />
        </button>
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => void insertMedia("photo", event)} />
        <input ref={pdfInput} type="file" accept="application/pdf" hidden onChange={(event) => void insertMedia("pdf", event)} />
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
      {sending ? <p className="editor-toolbar__status" role="status">Envoi du fichier en cours…</p> : null}
      {error ? (
        <p className="editor-toolbar__error" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
