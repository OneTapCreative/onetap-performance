"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { initialRecords, PerformanceRecord } from "@/lib/data";
const DemoContext = createContext<{
  records: PerformanceRecord[];
  setRecords: (rows: PerformanceRecord[]) => void;
  publication: string;
  setPublication: (value: string) => void;
} | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState(initialRecords),
    [publication, setPublication] = useState("");
  return (
    <DemoContext.Provider
      value={{ records, setRecords, publication, setPublication }}
    >
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("DemoProvider required");
  return ctx;
}
