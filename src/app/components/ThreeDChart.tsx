"use client";

import dynamic from "next/dynamic";
import React, { useMemo } from "react";
import { useExcelStore } from "@/app/store/useExcelStore";

// Plotly needs dynamic import (no SSR)
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ThreeDChart() {
  const { data } = useExcelStore();

  const { x, y, z, labels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { x: [], y: [], z: [], labels: { x: "", y: "", z: "" } };
    }

    const firstRow = data[0] as Record<string, any>;
    const columns = Object.keys(firstRow);

    const numericCols = columns.filter((col) => {
      const value = data.find(
        (row) => row[col] !== null && row[col] !== undefined && row[col] !== ""
      )?.[col];

      if (value === undefined) return false;
      const num = Number(value);
      return !Number.isNaN(num);
    });

    if (numericCols.length < 3) {
      return { x: [], y: [], z: [], labels: { x: "", y: "", z: "" } };
    }

    const [xCol, yCol, zCol] = numericCols;

    return {
      x: data.map((row) => Number(row[xCol])),
      y: data.map((row) => Number(row[yCol])),
      z: data.map((row) => Number(row[zCol])),
      labels: { x: xCol, y: yCol, z: zCol },
    };
  }, [data]);

  const hasData = x.length > 0 && y.length > 0 && z.length > 0;

  if (!hasData) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-3xl border border-dashed border-slate-800/80 bg-slate-950/70 px-4 py-6 text-center">
        <p className="text-xs md:text-sm text-slate-400 max-w-xs">
          Upload a file with at least{" "}
          <span className="font-semibold">3 numeric columns</span> to see a 3D
          chart here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[260px] md:h-[320px] lg:h-[360px] w-full rounded-3xl border border-slate-800/80 bg-slate-950/80 p-2 md:p-3 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
      <Plot
        data={[
          {
            type: "scatter3d",
            mode: "markers",
            x,
            y,
            z,
            marker: {
              size: 4,
              opacity: 0.85,
            },
          } as any,
        ]}
        layout={{
          autosize: true,
          margin: { l: 0, r: 0, t: 0, b: 0 },
          scene: {
            xaxis: {
              title: { text: labels.x },
              gridcolor: "rgba(148,163,184,0.35)",
              zerolinecolor: "rgba(148,163,184,0.6)",
            },
            yaxis: {
              title: { text: labels.y },
              gridcolor: "rgba(148,163,184,0.35)",
              zerolinecolor: "rgba(148,163,184,0.6)",
            },
            zaxis: {
              title: { text: labels.z },
              gridcolor: "rgba(148,163,184,0.35)",
              zerolinecolor: "rgba(148,163,184,0.6)",
            },
            bgcolor: "rgba(15,23,42,0)",
          },
          paper_bgcolor: "rgba(15,23,42,0)",
        }}
        config={{
          displaylogo: false,
          responsive: true,
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
