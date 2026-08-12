import type { ReactNode } from "react";

export type DataColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
};

type DataTableProps<T> = {
  caption: string;
  columns: DataColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
};

export function DataTable<T>({ caption, columns, data, getRowKey }: DataTableProps<T>) {
  return (
    <div className="table-shell">
      <table className="data-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={column.align === "right" ? "is-right" : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.align === "right" ? "is-right tabular" : undefined}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
