import { z } from "zod";

export const richTextColors = ["#202521", "#185c4c", "#c84f3b", "#5b655f"] as const;

const safeHrefPattern = /^(?:\/[^\u0000-\u0020]*|#[^\u0000-\u0020]*|https?:\/\/[^\u0000-\u0020]+|mailto:[^\u0000-\u0020]+)$/i;

export function isSafeRichTextHref(value: string) {
  return safeHrefPattern.test(value);
}

const simpleMarkSchema = z.object({
  type: z.enum(["bold", "italic", "underline"]),
}).strict();

const linkMarkSchema = z.object({
  type: z.literal("link"),
  attrs: z.object({
    href: z.string().min(1).refine(isSafeRichTextHref),
    target: z.string().nullable().optional(),
    rel: z.string().nullable().optional(),
    class: z.string().nullable().optional(),
  }).strict(),
}).strict();

const textStyleMarkSchema = z.object({
  type: z.literal("textStyle"),
  attrs: z.object({
    color: z.enum(richTextColors),
  }).strict(),
}).strict();

const markSchema = z.union([simpleMarkSchema, linkMarkSchema, textStyleMarkSchema]);

const textSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  marks: z.array(markSchema).optional(),
}).strict();

const hardBreakSchema = z.object({
  type: z.literal("hardBreak"),
}).strict();

const inlineSchema = z.union([textSchema, hardBreakSchema]);

export type RichInline = z.infer<typeof inlineSchema>;

export type RichBlock =
  | { type: "paragraph"; content?: z.infer<typeof inlineSchema>[] }
  | { type: "heading"; attrs: { level: 2 | 3 }; content?: z.infer<typeof inlineSchema>[] }
  | { type: "bulletList"; content: RichListItem[] }
  | { type: "orderedList"; attrs?: { start?: number }; content: RichListItem[] };

export type RichListItem = {
  type: "listItem";
  content: RichBlock[];
};

const blockSchema: z.ZodType<RichBlock> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal("paragraph"),
      content: z.array(inlineSchema).optional(),
    }).strict(),
    z.object({
      type: z.literal("heading"),
      attrs: z.object({ level: z.union([z.literal(2), z.literal(3)]) }).strict(),
      content: z.array(inlineSchema).optional(),
    }).strict(),
    z.object({
      type: z.literal("bulletList"),
      content: z.array(listItemSchema).min(1),
    }).strict(),
    z.object({
      type: z.literal("orderedList"),
      attrs: z.object({ start: z.number().int().min(1).optional() }).strict().optional(),
      content: z.array(listItemSchema).min(1),
    }).strict(),
  ]),
);

const listItemSchema: z.ZodType<RichListItem> = z.lazy(() =>
  z.object({
    type: z.literal("listItem"),
    content: z.array(blockSchema).min(1),
  }).strict(),
);

export const richContentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(blockSchema),
}).strict();

export type RichContent = z.infer<typeof richContentSchema>;

function normalizeRichContentAttributes(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeRichContentAttributes);
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const normalized = Object.fromEntries(
    Object.entries(record).map(([key, child]) => [key, normalizeRichContentAttributes(child)]),
  );

  if (record.type === "text" && Array.isArray(normalized.marks)) {
    // Pasted text carries arbitrary colours; keep the palette ones and drop the rest.
    const marks = (normalized.marks as Array<Record<string, unknown>>).flatMap((mark) => {
      if (mark.type !== "textStyle") return [mark];
      const color = String((mark.attrs as Record<string, unknown> | undefined)?.color ?? "").toLowerCase();
      return (richTextColors as readonly string[]).includes(color) ? [{ type: "textStyle", attrs: { color } }] : [];
    });
    if (marks.length > 0) normalized.marks = marks;
    else delete normalized.marks;
  }

  if (record.type === "orderedList" && record.attrs && typeof record.attrs === "object") {
    const start = (record.attrs as Record<string, unknown>).start;
    normalized.attrs = typeof start === "number" ? { start } : {};
  }

  if (record.type === "link" && normalized.attrs && typeof normalized.attrs === "object") {
    const databaseAttributes = {
      ...(normalized.attrs as Record<string, unknown>),
    };
    delete databaseAttributes.title;
    normalized.attrs = databaseAttributes;
  }

  return normalized;
}

export function serializeRichContent(value: unknown): string {
  return JSON.stringify(richContentSchema.parse(normalizeRichContentAttributes(value)));
}

// Removes colour declarations (not background-color) from pasted HTML styles.
export function stripPastedColors(html: string): string {
  return html.replace(/(?<![-\w])color\s*:\s*[^;"']*;?/gi, "");
}
