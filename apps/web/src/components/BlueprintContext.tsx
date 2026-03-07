"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BlueprintContextValue {
  blueprintSummary: string | null;
  setBlueprintSummary: (summary: string | null) => void;
}

const BlueprintContext = createContext<BlueprintContextValue>({
  blueprintSummary: null,
  setBlueprintSummary: () => {},
});

export function BlueprintProvider({ children }: { children: ReactNode }) {
  const [blueprintSummary, setBlueprintSummary] = useState<string | null>(null);
  return (
    <BlueprintContext.Provider value={{ blueprintSummary, setBlueprintSummary }}>
      {children}
    </BlueprintContext.Provider>
  );
}

export function useBlueprintContext() {
  return useContext(BlueprintContext);
}
