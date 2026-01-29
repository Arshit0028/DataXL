"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ExcelRow = Record<string, any>;

type ExcelState = {
  data: ExcelRow[];
  sheetName: string | null;
  setData: (data: ExcelRow[], sheetName: string | null) => void;
  clear: () => void;
};

export const useExcelStore = create<ExcelState>()(
  persist(
    (set) => ({
      data: [],
      sheetName: null,
      setData: (data, sheetName) => set({ data, sheetName }),
      clear: () => set({ data: [], sheetName: null }),
    }),
    {
      name: "insightxl-excel-store", // 👈 key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
