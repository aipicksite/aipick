type Row = {
  label: string;
  values: (string | boolean)[];
};

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return (
      <span className={value ? "text-forest" : "text-ink/25"}>
        {value ? "✓" : "—"}
      </span>
    );
  }
  return <span>{value}</span>;
}

export default function ComparisonTable({
  columns,
  rows,
  highlightColumn = 0,
}: {
  columns: string[];
  rows: Row[];
  highlightColumn?: number;
}) {
  return (
    <div className="overflow-x-auto border border-line rounded-lg">
      <table className="w-full text-sm border-collapse min-w-[480px]">
        <thead>
          <tr className="bg-base">
            <th className="text-left font-medium text-ink/50 px-4 py-3 border-b border-line">
              &nbsp;
            </th>
            {columns.map((col, i) => (
              <th
                key={col}
                className={`text-left font-display font-semibold px-4 py-3 border-b border-line ${
                  i === highlightColumn ? "text-plum" : "text-ink/70"
                }`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.label} className={ri % 2 === 1 ? "bg-base/60" : ""}>
              <td className="px-4 py-3 text-ink/60 border-b border-line whitespace-nowrap">
                {row.label}
              </td>
              {row.values.map((v, i) => (
                <td
                  key={i}
                  className={`px-4 py-3 border-b border-line ${
                    i === highlightColumn ? "bg-plum/5 font-medium" : ""
                  }`}
                >
                  <Cell value={v} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
