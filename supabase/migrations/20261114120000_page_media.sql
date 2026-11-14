-- Photos and PDFs in pages and news (14/11/2026).
-- The rich content accepts a photo block, only from the page-media bucket.
create or replace function public.is_valid_rich_content(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select extensions.jsonb_matches_schema(
    $schema$
      {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$ref": "#/definitions/doc",
        "definitions": {
          "doc": {
            "type": "object",
            "required": ["type", "content"],
            "properties": {
              "type": { "const": "doc" },
              "content": {
                "type": "array",
                "items": { "$ref": "#/definitions/block" }
              }
            },
            "additionalProperties": false
          },
          "block": {
            "oneOf": [
              { "$ref": "#/definitions/paragraph" },
              { "$ref": "#/definitions/heading" },
              { "$ref": "#/definitions/bulletList" },
              { "$ref": "#/definitions/orderedList" },
              { "$ref": "#/definitions/image" }
            ]
          },
          "paragraph": {
            "type": "object",
            "required": ["type"],
            "properties": {
              "type": { "const": "paragraph" },
              "content": {
                "type": "array",
                "items": { "$ref": "#/definitions/inline" }
              }
            },
            "additionalProperties": false
          },
          "heading": {
            "type": "object",
            "required": ["type", "attrs"],
            "properties": {
              "type": { "const": "heading" },
              "attrs": {
                "type": "object",
                "required": ["level"],
                "properties": { "level": { "enum": [2, 3] } },
                "additionalProperties": false
              },
              "content": {
                "type": "array",
                "items": { "$ref": "#/definitions/inline" }
              }
            },
            "additionalProperties": false
          },
          "bulletList": {
            "type": "object",
            "required": ["type", "content"],
            "properties": {
              "type": { "const": "bulletList" },
              "content": {
                "type": "array",
                "minItems": 1,
                "items": { "$ref": "#/definitions/listItem" }
              }
            },
            "additionalProperties": false
          },
          "orderedList": {
            "type": "object",
            "required": ["type", "content"],
            "properties": {
              "type": { "const": "orderedList" },
              "attrs": {
                "type": "object",
                "properties": { "start": { "type": "integer", "minimum": 1 } },
                "additionalProperties": false
              },
              "content": {
                "type": "array",
                "minItems": 1,
                "items": { "$ref": "#/definitions/listItem" }
              }
            },
            "additionalProperties": false
          },
          "image": {
            "type": "object",
            "required": ["type", "attrs"],
            "properties": {
              "type": { "const": "image" },
              "attrs": {
                "type": "object",
                "required": ["src", "alt"],
                "properties": {
                  "src": {
                    "type": "string",
                    "pattern": "^https?://[^/\\s]+/storage/v1/object/public/page-media/[a-z0-9][a-z0-9-]*\\.(jpg|png|webp)$"
                  },
                  "alt": { "type": "string", "minLength": 1, "maxLength": 300 }
                },
                "additionalProperties": false
              }
            },
            "additionalProperties": false
          },
          "listItem": {
            "type": "object",
            "required": ["type", "content"],
            "properties": {
              "type": { "const": "listItem" },
              "content": {
                "type": "array",
                "minItems": 1,
                "items": {
                  "oneOf": [
                    { "$ref": "#/definitions/paragraph" },
                    { "$ref": "#/definitions/heading" },
                    { "$ref": "#/definitions/bulletList" },
                    { "$ref": "#/definitions/orderedList" },
                    { "$ref": "#/definitions/image" }
                  ]
                }
              }
            },
            "additionalProperties": false
          },
          "inline": {
            "oneOf": [
              { "$ref": "#/definitions/text" },
              { "$ref": "#/definitions/hardBreak" }
            ]
          },
          "text": {
            "type": "object",
            "required": ["type", "text"],
            "properties": {
              "type": { "const": "text" },
              "text": { "type": "string" },
              "marks": {
                "type": "array",
                "items": { "$ref": "#/definitions/mark" }
              }
            },
            "additionalProperties": false
          },
          "hardBreak": {
            "type": "object",
            "required": ["type"],
            "properties": { "type": { "const": "hardBreak" } },
            "additionalProperties": false
          },
          "mark": {
            "oneOf": [
              {
                "type": "object",
                "required": ["type"],
                "properties": { "type": { "enum": ["bold", "italic", "underline"] } },
                "additionalProperties": false
              },
              {
                "type": "object",
                "required": ["type", "attrs"],
                "properties": {
                  "type": { "const": "link" },
                  "attrs": {
                    "type": "object",
                    "required": ["href"],
                    "properties": {
                      "href": {
                        "type": "string",
                        "minLength": 1,
                        "pattern": "^(?:/[^\\x00-\\x20]*|#[^\\x00-\\x20]*|[hH][tT][tT][pP][sS]?://[^\\x00-\\x20]+|[mM][aA][iI][lL][tT][oO]:[^\\x00-\\x20]+)$"
                      },
                      "target": { "type": ["string", "null"] },
                      "rel": { "type": ["string", "null"] },
                      "class": { "type": ["string", "null"] }
                    },
                    "additionalProperties": false
                  }
                },
                "additionalProperties": false
              },
              {
                "type": "object",
                "required": ["type", "attrs"],
                "properties": {
                  "type": { "const": "textStyle" },
                  "attrs": {
                    "type": "object",
                    "required": ["color"],
                    "properties": {
                      "color": {
                        "enum": ["#202521", "#185c4c", "#c84f3b", "#5b655f"]
                      }
                    },
                    "additionalProperties": false
                  }
                },
                "additionalProperties": false
              }
            ]
          }
        }
      }
    $schema$::json,
    value
  )
$$;

-- Photos and PDFs uploaded from the editor; a removed one stays here (see uploadPageMedia).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('page-media', 'page-media', true, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy page_media_bucket_editor_read on storage.objects for select to authenticated
  using (bucket_id = 'page-media' and public.is_active_editor());
create policy page_media_bucket_editor_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'page-media' and public.is_active_editor());
create policy page_media_bucket_editor_delete on storage.objects for delete to authenticated
  using (bucket_id = 'page-media' and public.is_active_editor());
