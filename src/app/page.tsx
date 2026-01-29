"use client";

import React, {
  useState,
  ChangeEvent,
  useMemo,
  useEffect,
} from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  UploadCloud,
  Sparkles,
  Trash2,
  FileSpreadsheet,
  Database,
  Rows3,
} from "lucide-react";
import { useExcelStore } from "@/app/store/useExcelStore";

// Plotly needs dynamic import in Next.js (no SSR)
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

/* ----------------------------- Clean, full-height Data Table ----------------------------- */

function DataTable() {
  const { data } = useExcelStore();

  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0] as Record<string, any>);

  // detect numeric columns for right alignment
  const numericCols = useMemo(
    () =>
      new Set(
        columns.filter((col) => {
          const sampleRow = data.find((row) => {
            const v = row[col];
            return (
              v !== null &&
              v !== undefined &&
              String(v).trim() !== ""
            );
          });
          if (!sampleRow) return false;

          const num = Number(
            String(sampleRow[col])
              .replace(/,/g, "")
              .replace(/%/g, "")
          );
          return !Number.isNaN(num);
        })
      ),
    [columns, data]
  );

  return (
    <div className="relative w-full h-[calc(100vh-260px)] overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/80 backdrop-blur-sm shadow-[0_18px_45px_rgba(0,0,0,0.7)]">
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
                      {value === null ||
                      value === undefined ||
                      value === ""
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

/* ----------------------------- Analysis Panel (2D charts + explanation) ----------------------------- */

function AnalysisPanel() {
  const { data } = useExcelStore();

  // helper to parse numbers robustly
  const toNumber = (value: any): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") {
      return Number.isNaN(value) ? null : value;
    }
    if (typeof value === "string") {
      const cleaned = value
        .replace(/,/g, "")
        .replace(/%/g, "")
        .trim();
      if (cleaned === "") return null;
      const n = Number(cleaned);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  };

  const { numericCols, valuesByCol } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        numericCols: [] as string[],
        valuesByCol: {} as Record<string, number[]>,
      };
    }

    const firstRow = data[0] as Record<string, any>;
    const columns = Object.keys(firstRow);

    const numericCols: string[] = [];
    const valuesByCol: Record<string, number[]> = {};

    columns.forEach((col) => {
      const vals: number[] = [];
      data.forEach((row) => {
        const parsed = toNumber(row[col]);
        if (parsed !== null) vals.push(parsed);
      });
      if (vals.length > 0) {
        numericCols.push(col);
        valuesByCol[col] = vals;
      }
    });

    return { numericCols, valuesByCol };
  }, [data]);

  const [selectedCol, setSelectedCol] = useState<string>("");

  useEffect(() => {
    if (numericCols.length > 0) {
      setSelectedCol((prev) =>
        prev && numericCols.includes(prev) ? prev : numericCols[0]
      );
    } else {
      setSelectedCol("");
    }
  }, [numericCols]);

  if (!data || data.length === 0) {
    return null;
  }

  if (numericCols.length === 0) {
    return (
      <div className="w-full rounded-3xl border border-dashed border-slate-800/80 bg-slate-950/80 px-4 py-5 text-center text-xs md:text-sm text-slate-300">
        This sheet doesn&apos;t seem to have numeric columns I can chart.  
        2D analysis becomes available as soon as there are numbers (e.g. Sales, Quantity, Profit).
      </div>
    );
  }

  const values = valuesByCol[selectedCol] || [];
  const count = values.length;
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const avg =
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const trend =
    values.length > 1
      ? values[values.length - 1] - values[0]
      : 0;

  return (
    <div className="w-full rounded-3xl border border-slate-800/80 bg-slate-950/90 p-4 md:p-5 shadow-[0_18px_45px_rgba(0,0,0,0.85)] space-y-4">
      {/* Header + column selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm md:text-base font-semibold text-slate-100 flex items-center gap-2">
            Graphical Analysis
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] md:text-[11px] text-sky-300">
              Charts & Diagrams
            </span>
          </h3>
          <p className="text-[11px] md:text-xs text-slate-400">
            Visual explanation of one numeric column at a time – trend + distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Metric:</span>
          <select
            className="rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] md:text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={selectedCol}
            onChange={(e) => setSelectedCol(e.target.value)}
          >
            {numericCols.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <SummaryCard label="Data points" value={count} />
        <SummaryCard label="Minimum" value={min} />
        <SummaryCard label="Maximum" value={max} />
        <SummaryCard
          label="Average"
          value={avg !== null ? Number(avg.toFixed(2)) : null}
          highlight
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
          <p className="mb-2 text-[11px] md:text-xs text-slate-400">
            Trend over rows (reading from top to bottom of your sheet).
          </p>
          <div className="h-[200px] md:h-[230px]">
            <Plot
              data={[
                {
                  type: "scatter",
                  mode: "lines+markers",
                  x: values.map((_, i) => i + 1),
                  y: values,
                } as any,
              ]}
              layout={{
                autosize: true,
                margin: { l: 40, r: 10, t: 10, b: 30 },
                xaxis: {
                  title: "Row index",
                  gridcolor: "rgba(148,163,184,0.25)",
                },
                yaxis: {
                  title: selectedCol,
                  gridcolor: "rgba(148,163,184,0.25)",
                },
                paper_bgcolor: "rgba(15,23,42,0)",
                plot_bgcolor: "rgba(15,23,42,0)",
              }}
              config={{
                displaylogo: false,
                responsive: true,
              }}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          {trend !== 0 && (
            <p className="mt-1 text-[11px] md:text-xs text-slate-400">
              {trend > 0
                ? "Overall, this metric increases from the first to the last row."
                : "Overall, this metric decreases from the first to the last row."}
            </p>
          )}
        </div>

        {/* Distribution chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
          <p className="mb-2 text-[11px] md:text-xs text-slate-400">
            Distribution of values (how they&apos;re spread out).
          </p>
          <div className="h-[200px] md:h-[230px]">
            <Plot
              data={[
                {
                  type: "histogram",
                  x: values,
                  nbinsx: 10,
                } as any,
              ]}
              layout={{
                autosize: true,
                margin: { l: 40, r: 10, t: 10, b: 30 },
                xaxis: {
                  title: selectedCol,
                  gridcolor: "rgba(148,163,184,0.25)",
                },
                yaxis: {
                  title: "Frequency",
                  gridcolor: "rgba(148,163,184,0.25)",
                },
                paper_bgcolor: "rgba(15,23,42,0)",
                plot_bgcolor: "rgba(15,23,42,0)",
              }}
              config={{
                displaylogo: false,
                responsive: true,
              }}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Summary card for numeric insight */
type SummaryCardProps = {
  label: string;
  value: number | null;
  highlight?: boolean;
};

function SummaryCard({ label, value, highlight }: SummaryCardProps) {
  return (
    <div
      className={
        "rounded-2xl border px-3 py-2.5 md:px-4 md:py-3 " +
        (highlight
          ? "border-sky-500/50 bg-sky-500/10"
          : "border-slate-800 bg-slate-950/80")
      }
    >
      <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm md:text-base font-semibold text-slate-100">
        {value === null ? "—" : value}
      </p>
    </div>
  );
}

/* ----------------------------- Page ----------------------------- */

export default function HomePage() {
  const { data, sheetName, setData, clear } = useExcelStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rowsCount = data.length;
  const columnsCount =
    rowsCount > 0 ? Object.keys(data[0] || {}).length : 0;

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errRes = await res.json().catch(() => ({}));
        throw new Error(errRes.error || "Upload failed");
      }

      const json = await res.json();
      setData(json.rows, json.sheetName);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Animated background blobs */}
      <motion.div
        className="pointer-events-none fixed -top-40 -right-40 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl"
        initial={{ opacity: 0, x: 120, y: -80, scale: 0.7 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <motion.div
        className="pointer-events-none fixed bottom-[-10rem] left-[-6rem] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl"
        initial={{ opacity: 0, x: -120, y: 80, scale: 0.7 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
      />

      <main className="relative z-10 flex min-h-screen flex-col">
        {/* Top Bar */}
        <motion.header
          className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-6 py-4 flex items-center justify-between"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-[0_0_30px_rgba(56,189,248,0.6)]"
              initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: 0.1,
              }}
            >
              <FileSpreadsheet className="h-5 w-5 text-slate-950" />
            </motion.div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight flex items-center gap-2">
                DataForge
                <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-300">
                  Data Canvas
                </span>
              </h1>
              <p className="text-[11px] md:text-xs text-slate-400">
                Upload Excel. Explore instantly. No setup, just insight.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-[11px] md:text-xs text-red-300 hover:bg-red-500/20 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Data
            </button>
          </div>
        </motion.header>

        {/* Content */}
        <section className="flex-1 px-4 pb-6 pt-4 md:px-8 md:pt-6">
          <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col gap-5">
            {/* Upload + description */}
            <motion.div
              className="w-full space-y-4"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              {/* Hero / Description card */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-slate-950/95 p-4 md:p-5 shadow-[0_18px_50px_rgba(0,0,0,0.9)]">
                <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_0_0,rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(45,212,191,0.18),transparent_55%)]" />
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Smart Excel-to-Insight Viewer
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-50">
                    Turn spreadsheets into a live, interactive table.
                  </h2>
                  <p className="text-xs md:text-sm text-slate-300/90">
                    Drag in any Excel file and InsightXL instantly builds a
                    clean, full-screen preview with ready-made visual analysis.
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300/80">
                    <li>• Supports .xlsx, .xls, .csv</li>
                    <li>• Full-screen table view for comfortable reading</li>
                    <li>• Charts that explain trends and distribution</li>
                  </ul>
                </div>
              </div>

              {/* Upload card */}
              <motion.div
                className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/90 p-4 md:p-5 shadow-[0_18px_45px_rgba(0,0,0,0.85)]"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm md:text-base font-medium">
                      Upload Excel file
                    </h3>
                    <p className="text-[11px] md:text-xs text-slate-400">
                      Supported:
                      <span className="ml-1 font-mono text-slate-300">
                        .xlsx .xls .csv
                      </span>
                    </p>
                  </div>
                  <Database className="h-5 w-5 text-sky-400/70" />
                </div>

                <label className="group mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/90 bg-slate-900/70 px-4 py-6 text-center transition hover:border-sky-400/90 hover:bg-slate-900/90">
                  <div className="mb-2 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 group-hover:bg-sky-500/25 transition">
                      {isUploading ? (
                        <motion.div
                          className="h-5 w-5"
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.9,
                            ease: "linear",
                          }}
                        >
                          <UploadCloud className="h-5 w-5 text-sky-300" />
                        </motion.div>
                      ) : (
                        <UploadCloud className="h-5 w-5 text-sky-300" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {isUploading
                      ? "Uploading & parsing…"
                      : "Click to select file"}
                  </span>
                  <span className="mt-1 text-[11px] text-slate-400">
                    Your file stays local to this demo environment and is only
                    used to render the preview below.
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {error && (
                  <p className="mt-3 text-[11px] text-red-400">
                    Error: {error}
                  </p>
                )}
              </motion.div>

              {/* Quick stats */}
              <motion.div
                className="grid grid-cols-2 gap-2 md:gap-3 mt-2 md:mt-3"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.35 }}
              >
                <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2">
                  <Rows3 className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                      Rows
                    </p>
                    <p className="text-sm font-semibold">
                      {rowsCount || "--"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2">
                  <TableIcon />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                      Columns
                    </p>
                    <p className="text-sm font-semibold">
                      {columnsCount || "--"}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Data preview + analysis */}
            <motion.div
              className="flex w-full flex-1 flex-col gap-3"
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm md:text-base font-semibold flex items-center gap-2">
                    Data Preview
                    {sheetName && (
                      <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-300">
                        {sheetName}
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] md:text-xs text-slate-400">
                    Full-screen table for clean reading, plus visual charts that
                    explain your numbers.
                  </p>
                </div>
                <span className="text-[11px] md:text-xs text-slate-400">
                  {rowsCount
                    ? `${rowsCount} row${rowsCount > 1 ? "s" : ""} • ${
                        columnsCount || 0
                      } col${columnsCount === 1 ? "" : "s"}`
                    : "No data loaded yet"}
                </span>
              </div>

              {rowsCount === 0 ? (
                <motion.div
                  className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800/80 bg-slate-950/70 px-4 py-10 text-center shadow-[0_18px_40px_rgba(0,0,0,0.85)]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                    delay: 0.25,
                  }}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/90">
                    <FileSpreadsheet className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm md:text-base font-medium text-slate-100">
                    No file loaded yet
                  </p>
                  <p className="mt-1 text-[11px] md:text-xs text-slate-400 max-w-xs">
                    Start by uploading an Excel file above. InsightXL will
                    render a live, scrollable table and charts here.
                  </p>
                </motion.div>
              ) : (
                <>
                  <DataTable />
                  <AnalysisPanel />
                </>
              )}
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* Small icon helper so we don’t import another one */
function TableIcon() {
  return (
    <div className="relative flex h-4 w-4 items-center justify-center">
      <div className="h-3.5 w-3.5 rounded-sm border border-sky-400/70" />
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[1px] p-[1px]">
        <div className="border-r border-b border-sky-400/50" />
        <div className="border-b border-sky-400/50" />
        <div className="border-r border-sky-400/50" />
        <div />
      </div>
    </div>
  );
}
