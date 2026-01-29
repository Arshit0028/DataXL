import { useExcelStore } from "@/app/store/useExcelStore";
function DataTable() {
  const { data } = useExcelStore();

  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0] as Record<string, any>);

  // detect numeric columns for right alignment
  const numericCols = new Set(
    columns.filter((col) => {
      const sampleRow = data.find((row) => {
        const v = row[col];
        return v !== null && v !== undefined && String(v).trim() !== "";
      });
      if (!sampleRow) return false;
      const num = Number(
        String(sampleRow[col]).replace(/,/g, "").replace(/%/g, "")
      );
      return !Number.isNaN(num);
    })
  );

  return (
    <div className="relative w-full max-h-[420px] md:max-h-[480px] overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/70 backdrop-blur-sm shadow-[0_18px_45px_rgba(0,0,0,0.7)]">
      <table className="min-w-full text-xs md:text-sm border-collapse">
        <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm">
          <tr>
            {/* index column */}
            <th className="px-3 py-2.5 text-[10px] md:text-[11px] font-medium text-slate-400 border-b border-slate-800/80 text-right w-[40px]">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-3 py-2.5 text-[10px] md:text-[11px] font-semibold tracking-wide text-slate-200 border-b border-slate-800/80 text-left whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, idx: number) => (
            <tr
              key={idx}
              className={`border-b border-slate-900/80 transition-colors ${
                idx % 2 === 0 ? "bg-slate-950/70" : "bg-slate-900/70"
              } hover:bg-slate-800/70`}
            >
              {/* index cell */}
              <td className="px-3 py-2.5 text-[11px] md:text-xs text-slate-500 text-right align-middle">
                {idx + 1}
              </td>

              {columns.map((col) => {
                const value = row[col];
                const isNumeric = numericCols.has(col);
                const baseClasses =
                  "px-3 py-2.5 align-middle whitespace-nowrap max-w-[220px]";

                return (
                  <td
                    key={`${idx}-${col}`}
                    className={
                      baseClasses +
                      " " +
                      (isNumeric
                        ? "text-right font-mono text-slate-200"
                        : "text-left text-slate-200")
                    }
                    title={value != null ? String(value) : ""}
                  >
                    {/* truncate long values but keep tooltip */}
                    <span className="inline-block overflow-hidden text-ellipsis whitespace-nowrap max-w-[210px]">
                      {value === null || value === undefined || value === ""
                        ? "—"
                        : String(value)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-950 to-transparent" />
    </div>
  );
}
