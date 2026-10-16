-- Videos and the map now load on request: the privacy page says so, before "Vos droits".
-- Pages edited since then keep their text if the section is already there.
with section(nodes) as (
  select '[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Vidéos et carte"}]},{"type":"paragraph","content":[{"type":"text","text":"Les vidéos (YouTube, Vimeo) et la carte (Google Maps) ne se chargent que si vous cliquez dessus. Ces services peuvent alors déposer des cookies et recevoir votre adresse IP, selon leurs propres règles de confidentialité. Avant le clic, seule l''image d''aperçu d''une vidéo YouTube est chargée depuis ses serveurs, sans cookie."}]}]'::jsonb
),
target as (
  select p.id, p.content->'content' as blocks,
    coalesce((
      select min(x.ord) - 1 from jsonb_array_elements(p.content->'content') with ordinality as x(e, ord)
      where x.e->>'type' = 'heading' and x.e->'content'->0->>'text' = 'Vos droits'
    ), jsonb_array_length(p.content->'content')) as position
  from public.pages p
  where p.slug = 'confidentialite' and p.content::text not like '%"Vidéos et carte"%'
)
update public.pages p
set content = jsonb_set(
  p.content, '{content}',
  coalesce((select jsonb_agg(x.e order by x.ord) from jsonb_array_elements(t.blocks) with ordinality as x(e, ord) where x.ord <= t.position), '[]'::jsonb)
  || (select nodes from section)
  || coalesce((select jsonb_agg(x.e order by x.ord) from jsonb_array_elements(t.blocks) with ordinality as x(e, ord) where x.ord > t.position), '[]'::jsonb)
)
from target t
where p.id = t.id;
