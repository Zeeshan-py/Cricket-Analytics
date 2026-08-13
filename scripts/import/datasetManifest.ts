import type { CricketFormatCode } from "@/types/database";

export type DatasetKind = "player-batting-aggregate" | "player-bowling-aggregate" | "series-summary";

export type DatasetFileDefinition = {
  file: string;
  format: CricketFormatCode;
  kind: DatasetKind;
  description: string;
};

export const datasetManifest: DatasetFileDefinition[] = [
  {
    file: "Dataset/archive/tb.csv",
    format: "test",
    kind: "player-batting-aggregate",
    description: "Test career batting leaderboard aggregate."
  },
  {
    file: "Dataset/archive/tbo.csv",
    format: "test",
    kind: "player-bowling-aggregate",
    description: "Test career bowling leaderboard aggregate."
  },
  {
    file: "Dataset/archive/tt.csv",
    format: "test",
    kind: "series-summary",
    description: "Test series/tournament historical summaries."
  },
  {
    file: "Dataset/archive/odb.csv",
    format: "odi",
    kind: "player-batting-aggregate",
    description: "ODI career batting leaderboard aggregate."
  },
  {
    file: "Dataset/archive/odbo.csv",
    format: "odi",
    kind: "player-bowling-aggregate",
    description: "ODI career bowling leaderboard aggregate."
  },
  {
    file: "Dataset/archive/odt.csv",
    format: "odi",
    kind: "series-summary",
    description: "ODI series/tournament historical summaries."
  },
  {
    file: "Dataset/archive/twb.csv",
    format: "t20i",
    kind: "player-batting-aggregate",
    description: "T20I career batting leaderboard aggregate."
  },
  {
    file: "Dataset/archive/twbo.csv",
    format: "t20i",
    kind: "player-bowling-aggregate",
    description: "T20I career bowling leaderboard aggregate."
  },
  {
    file: "Dataset/archive/twt.csv",
    format: "t20i",
    kind: "series-summary",
    description: "T20I series/tournament historical summaries."
  }
];
