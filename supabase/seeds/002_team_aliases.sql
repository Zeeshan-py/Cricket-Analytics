-- Seed common international/composite teams observed in the current csv files.
-- The ETL also includes a richer alias map in scripts/import/teamAliases.ts.

insert into public.teams (name, short_name, slug, country, team_type)
values
  ('Afghanistan', 'AFG', 'afghanistan', 'Afghanistan', 'international'),
  ('Africa XI', 'Afr', 'africa-xi', null, 'composite'),
  ('Asia XI', 'Asia', 'asia-xi', null, 'composite'),
  ('Australia', 'AUS', 'australia', 'Australia', 'international'),
  ('Bangladesh', 'BAN', 'bangladesh', 'Bangladesh', 'international'),
  ('Bermuda', 'BMUDA', 'bermuda', 'Bermuda', 'international'),
  ('Canada', 'CAN', 'canada', 'Canada', 'international'),
  ('England', 'ENG', 'england', 'England', 'international'),
  ('Hong Kong', 'HKG', 'hong-kong', 'Hong Kong', 'international'),
  ('ICC World XI', 'ICC', 'icc-world-xi', null, 'composite'),
  ('India', 'INDIA', 'india', 'India', 'international'),
  ('Ireland', 'IRE', 'ireland', 'Ireland', 'international'),
  ('Kenya', 'KENYA', 'kenya', 'Kenya', 'international'),
  ('Namibia', 'NAM', 'namibia', 'Namibia', 'international'),
  ('Nepal', 'NEPAL', 'nepal', 'Nepal', 'international'),
  ('Netherlands', 'NED', 'netherlands', 'Netherlands', 'international'),
  ('New Zealand', 'NZ', 'new-zealand', 'New Zealand', 'international'),
  ('Oman', 'OMAN', 'oman', 'Oman', 'international'),
  ('Pakistan', 'PAK', 'pakistan', 'Pakistan', 'international'),
  ('Papua New Guinea', 'PNG', 'papua-new-guinea', 'Papua New Guinea', 'international'),
  ('Scotland', 'SCOT', 'scotland', 'Scotland', 'international'),
  ('South Africa', 'SA', 'south-africa', 'South Africa', 'international'),
  ('Sri Lanka', 'SL', 'sri-lanka', 'Sri Lanka', 'international'),
  ('United Arab Emirates', 'UAE', 'united-arab-emirates', 'United Arab Emirates', 'international'),
  ('United States', 'USA', 'united-states', 'United States', 'international'),
  ('West Indies', 'WI', 'west-indies', 'West Indies', 'international'),
  ('Zimbabwe', 'ZIM', 'zimbabwe', 'Zimbabwe', 'international')
on conflict (slug) do update
set
  name = excluded.name,
  short_name = excluded.short_name,
  country = excluded.country,
  team_type = excluded.team_type,
  updated_at = now();
