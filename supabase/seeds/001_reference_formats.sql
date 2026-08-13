insert into public.formats (code, name, slug, description)
values
  ('test', 'Test', 'test', 'International Test cricket and other long-form cricket records.'),
  ('odi', 'ODI', 'odi', 'One Day International cricket records and series.'),
  ('t20', 'T20', 't20', 'Twenty20 cricket records where the source does not distinguish domestic and international.'),
  ('t20i', 'T20I', 't20i', 'Twenty20 International cricket records and series.'),
  ('first-class', 'First Class', 'first-class', 'First-class cricket records and future domestic long-form imports.'),
  ('list-a', 'List A', 'list-a', 'List A cricket records and future one-day domestic imports.'),
  ('other', 'Other', 'other', 'Fallback format for sources that cannot yet be mapped safely.')
on conflict (code) do update
set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();
