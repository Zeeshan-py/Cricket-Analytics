# Dataset Inspection

Phase 2 now treats Cricsheet JSON as the primary raw cricket source. Representative Cricsheet files are stored in `data/sample/cricsheet` for parser testing only. The full extracted dataset should remain outside the repository and be referenced with `CRICSHEET_DATA_DIR`.

The legacy CSV files are supplementary aggregate/reference datasets. They should not be used to invent match-level scorecards.

## Primary Cricsheet Sample Files

The sample directory currently contains 8 JSON match files:

- 6 Test matches
- 2 ODI matches
- 26 innings
- 13,109 deliveries
- 225 wicket events
- 176 player appearances
- 40 officials

`pnpm data:inspect:cricsheet` discovered these fields in the samples:

| Area | Fields |
| --- | --- |
| top-level | `meta`, `info`, `innings` |
| `meta` | `data_version`, `created`, `revision` |
| `info` | `balls_per_over`, `city`, `dates`, `event`, `gender`, `match_type`, `match_type_number`, `officials`, `outcome`, `overs`, `player_of_match`, `players`, `registry`, `season`, `team_type`, `teams`, `toss`, `venue` |
| innings | `team`, `overs`, `declared`, `powerplays`, `target` |
| over | `over`, `deliveries` |
| delivery | `actual_delivery`, `batter`, `bowler`, `non_striker`, `runs`, `extras`, `wickets`, `replacements`, `review` |
| runs | `batter`, `extras`, `total`, `non_boundary` |
| extras | `byes`, `legbyes`, `noballs`, `wides` |
| wicket | `player_out`, `kind`, `fielders` |

Observed wicket kinds include `caught`, `bowled`, `lbw`, `caught and bowled`, `run out`, `stumped`, and `hit wicket`.

## Cricsheet Mapping

| Cricsheet Field | Database Target |
| --- | --- |
| file name / id | `matches.external_id`, `matches.source_record_id` |
| `meta.data_version`, `meta.revision` | `matches.data_version`, `matches.revision` |
| `info.match_type` | `formats` and `matches.format_id` |
| `info.dates` | `matches.match_date`, `matches.end_date` |
| `info.season` | `matches.season_label`, `matches.season_year` |
| `info.event.name`, `info.event.match_number` | `tournaments`, `matches.match_number` |
| `info.teams` | `teams`, `matches.team_1_id`, `matches.team_2_id` |
| `info.players`, `info.registry.people` | `players`, `players.cricsheet_id` |
| `info.venue`, `info.city` | `venues`, `matches.venue_id` |
| `info.toss` | `matches.toss_winner_team_id`, `matches.toss_decision` |
| `info.outcome` | `matches.winner_team_id`, `matches.outcome_*`, `matches.status`, `matches.result` |
| `info.player_of_match` | `awards`, `player_match_statistics.player_of_match` |
| `info.officials` | `match_officials` |
| innings `team`, `declared`, `target`, `powerplays` | `match_innings` |
| delivery batter/bowler/non-striker/runs/extras/wickets/review/replacements | `match_deliveries` |
| delivery aggregates | `batting_statistics`, `bowling_statistics`, `fielding_statistics`, `player_match_statistics` |

## Supplementary CSV Shape

| File | Rows | Confirmed Type | Format | Key Fields |
| --- | ---: | --- | --- | --- |
| `tb.csv` | 97 | Player batting career aggregate | Test | `Player`, `Span`, `Mat`, `Inns`, `NO`, `Runs`, `HS`, `Ave`, `100`, `50`, `0` |
| `tbo.csv` | 79 | Player bowling career aggregate | Test | `Player`, `Span`, `Mat`, `Inns`, `Balls`, `Runs`, `Wkts`, `BBI`, `BBM`, `Ave`, `Econ`, `SR`, `5`, `10` |
| `tt.csv` | 794 | Series/tournament summary | Test | `Series/Tournament`, `Season`, `Winner`, `Margin` |
| `odb.csv` | 119 | Player batting career aggregate | ODI | `Player`, `Span`, `Mat`, `Inns`, `NO`, `Runs`, `HS`, `Ave`, `BF`, `SR`, `100`, `50`, `0`, `4s`, `6s` |
| `odbo.csv` | 76 | Player bowling career aggregate | ODI | `Player`, `Span`, `Mat`, `Inns`, `Balls`, `Runs`, `Wkts`, `BBI`, `Ave`, `Econ`, `SR`, `4`, `5` |
| `odt.csv` | 871 | Series/tournament summary | ODI | `Series/Tournament`, `Season`, `Winner`, `Margin` |
| `twb.csv` | 105 | Player batting career aggregate | T20I | `Player`, `Span`, `Mat`, `Inns`, `NO`, `Runs`, `HS`, `Ave`, `BF`, `SR`, `100`, `50`, `0`, `4s`, `6s` |
| `twbo.csv` | 181 | Player bowling career aggregate | T20I | `Player`, `Span`, `Mat`, `Inns`, `Overs`, `Mdns`, `Runs`, `Wkts`, `BBI`, `Ave`, `Econ`, `SR`, `4`, `5` |
| `twt.csv` | 387 | Series/tournament summary | T20I | `Series/Tournament`, `Season`, `Winner`, `Margin` |

## Confirmed Shape

- Player rows contain names with team/country codes in parentheses, such as `SR Tendulkar (INDIA)`.
- Some players have composite team codes such as `Asia/ICC/SL`; these are treated as team memberships/aliases, not duplicate players.
- Tournament files are series summaries, not match-level scorecards.
- The tournament files do not expose venues, team-1/team-2 IDs, innings, scorecards, awards, or individual player match performances.
- Some season values are multi-year labels such as `2011-2013/14` and `2020-2022/23`; the parser now extracts the first and last year safely.
- Several files have a leading unnamed index column; the importer preserves it as source metadata and does not model it as cricket data.

## Source Boundaries

The normalized match tables in the Supabase schema are populated from Cricsheet JSON. They are not populated from aggregate CSVs because doing so would create false match-level facts.

Supplementary CSVs import into:

- `players`
- `teams`
- `formats`
- `imported_player_career_aggregates`
- `imported_series_summaries`
- `import_batches`
- `import_errors`

Cricsheet JSON imports into:

- `venues`
- `tournaments`
- `matches`
- `match_innings`
- `match_deliveries`
- `match_officials`
- `batting_statistics`
- `bowling_statistics`
- `fielding_statistics`
- `player_match_statistics`
- `awards`

## Validation Result

`pnpm data:inspect` passes against the Cricsheet sample files with zero validation errors. Supplementary CSV checks are skipped when the legacy aggregate files are not present in the checkout.
