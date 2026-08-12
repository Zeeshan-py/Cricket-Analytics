import Link from "next/link";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import type { Player } from "@/data/mockCricketData";

type PlayerTableProps = {
  players: Player[];
};

export function PlayerTable({ players }: PlayerTableProps) {
  const columns: DataColumn<Player>[] = [
    {
      key: "name",
      header: "Player",
      render: (player) => (
        <Link className="table-primary-link" href={`/players/${player.id}`}>
          {player.name}
          <span>{player.role}</span>
        </Link>
      )
    },
    { key: "country", header: "Country", render: (player) => player.country },
    { key: "matches", header: "Matches", align: "right", render: (player) => player.matches },
    { key: "runs", header: "Runs", align: "right", render: (player) => player.runs.toLocaleString("en") },
    { key: "wickets", header: "Wickets", align: "right", render: (player) => player.wickets },
    { key: "average", header: "Average", align: "right", render: (player) => player.average }
  ];

  return (
    <DataTable
      caption="Top players demo table. Values are placeholders until the cricket dataset is connected."
      columns={columns}
      data={players}
      getRowKey={(player) => player.id}
    />
  );
}
