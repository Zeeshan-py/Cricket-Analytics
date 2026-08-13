export type TeamAlias = {
  name: string;
  slug: string;
  shortName?: string;
  country?: string;
  teamType?: "international" | "domestic" | "franchise" | "composite" | "other";
};

export const teamAliases: Record<string, TeamAlias> = {
  AFG: { name: "Afghanistan", slug: "afghanistan", shortName: "AFG", country: "Afghanistan" },
  Afghanistan: { name: "Afghanistan", slug: "afghanistan", shortName: "AFG", country: "Afghanistan" },
  Afr: { name: "Africa XI", slug: "africa-xi", shortName: "Afr", teamType: "composite" },
  Asia: { name: "Asia XI", slug: "asia-xi", shortName: "Asia", teamType: "composite" },
  AUS: { name: "Australia", slug: "australia", shortName: "AUS", country: "Australia" },
  Australia: { name: "Australia", slug: "australia", shortName: "AUS", country: "Australia" },
  BAN: { name: "Bangladesh", slug: "bangladesh", shortName: "BAN", country: "Bangladesh" },
  Bangladesh: { name: "Bangladesh", slug: "bangladesh", shortName: "BAN", country: "Bangladesh" },
  BDESH: { name: "Bangladesh", slug: "bangladesh", shortName: "BAN", country: "Bangladesh" },
  BMUDA: { name: "Bermuda", slug: "bermuda", shortName: "BMUDA", country: "Bermuda" },
  CAN: { name: "Canada", slug: "canada", shortName: "CAN", country: "Canada" },
  ENG: { name: "England", slug: "england", shortName: "ENG", country: "England" },
  England: { name: "England", slug: "england", shortName: "ENG", country: "England" },
  HKG: { name: "Hong Kong", slug: "hong-kong", shortName: "HKG", country: "Hong Kong" },
  ICC: { name: "ICC World XI", slug: "icc-world-xi", shortName: "ICC", teamType: "composite" },
  INDIA: { name: "India", slug: "india", shortName: "INDIA", country: "India" },
  India: { name: "India", slug: "india", shortName: "INDIA", country: "India" },
  IRE: { name: "Ireland", slug: "ireland", shortName: "IRE", country: "Ireland" },
  Ireland: { name: "Ireland", slug: "ireland", shortName: "IRE", country: "Ireland" },
  KENYA: { name: "Kenya", slug: "kenya", shortName: "KENYA", country: "Kenya" },
  Kenya: { name: "Kenya", slug: "kenya", shortName: "KENYA", country: "Kenya" },
  NAM: { name: "Namibia", slug: "namibia", shortName: "NAM", country: "Namibia" },
  NEPAL: { name: "Nepal", slug: "nepal", shortName: "NEPAL", country: "Nepal" },
  NED: { name: "Netherlands", slug: "netherlands", shortName: "NED", country: "Netherlands" },
  Netherlands: { name: "Netherlands", slug: "netherlands", shortName: "NED", country: "Netherlands" },
  NZ: { name: "New Zealand", slug: "new-zealand", shortName: "NZ", country: "New Zealand" },
  "New Zealand": { name: "New Zealand", slug: "new-zealand", shortName: "NZ", country: "New Zealand" },
  OMAN: { name: "Oman", slug: "oman", shortName: "OMAN", country: "Oman" },
  PAK: { name: "Pakistan", slug: "pakistan", shortName: "PAK", country: "Pakistan" },
  Pakistan: { name: "Pakistan", slug: "pakistan", shortName: "PAK", country: "Pakistan" },
  PNG: { name: "Papua New Guinea", slug: "papua-new-guinea", shortName: "PNG", country: "Papua New Guinea" },
  SA: { name: "South Africa", slug: "south-africa", shortName: "SA", country: "South Africa" },
  "South Africa": { name: "South Africa", slug: "south-africa", shortName: "SA", country: "South Africa" },
  SCOT: { name: "Scotland", slug: "scotland", shortName: "SCOT", country: "Scotland" },
  Scotland: { name: "Scotland", slug: "scotland", shortName: "SCOT", country: "Scotland" },
  SL: { name: "Sri Lanka", slug: "sri-lanka", shortName: "SL", country: "Sri Lanka" },
  "Sri Lanka": { name: "Sri Lanka", slug: "sri-lanka", shortName: "SL", country: "Sri Lanka" },
  UAE: {
    name: "United Arab Emirates",
    slug: "united-arab-emirates",
    shortName: "UAE",
    country: "United Arab Emirates"
  },
  USA: { name: "United States", slug: "united-states", shortName: "USA", country: "United States" },
  WI: { name: "West Indies", slug: "west-indies", shortName: "WI", country: "West Indies" },
  "West Indies": { name: "West Indies", slug: "west-indies", shortName: "WI", country: "West Indies" },
  ZIM: { name: "Zimbabwe", slug: "zimbabwe", shortName: "ZIM", country: "Zimbabwe" },
  Zimbabwe: { name: "Zimbabwe", slug: "zimbabwe", shortName: "ZIM", country: "Zimbabwe" }
};

export function resolveTeamAlias(value: string): TeamAlias {
  const trimmed = value.trim();
  const alias = teamAliases[trimmed];

  if (alias) {
    return {
      teamType: "international",
      ...alias
    };
  }

  return {
    name: trimmed,
    slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    shortName: trimmed.length <= 6 ? trimmed : undefined,
    country: trimmed,
    teamType: "other"
  };
}
