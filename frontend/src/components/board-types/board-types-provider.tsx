"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export const boardCategories = ["Single Wall", "Double Wall", "Duplex/Paperboard"] as const;
export type BoardCategory = (typeof boardCategories)[number];
export type BoardTypeStatus = "Active" | "Inactive";
export type BoardType = {
  id: string;
  name: string;
  category: BoardCategory;
  fluteType: string;
  status: BoardTypeStatus;
};
export type BoardTypeDraft = Pick<BoardType, "name" | "category" | "fluteType">;

const storageKey = "cots-board-types-v1";
const defaultBoardTypes: BoardType[] = [
  { id: "single-b", name: "Single B", category: "Single Wall", fluteType: "B", status: "Active" },
  { id: "single-c", name: "Single C", category: "Single Wall", fluteType: "C", status: "Active" },
  { id: "double-bc", name: "Double BC", category: "Double Wall", fluteType: "BC", status: "Active" },
  { id: "double-be", name: "Double BE", category: "Double Wall", fluteType: "BE", status: "Active" },
  { id: "duplex", name: "Duplex", category: "Duplex/Paperboard", fluteType: "", status: "Active" },
];

function validBoardType(value: unknown): value is BoardType {
  return Boolean(value) && typeof value === "object" &&
    typeof (value as BoardType).id === "string" &&
    typeof (value as BoardType).name === "string" &&
    boardCategories.includes((value as BoardType).category) &&
    typeof (value as BoardType).fluteType === "string" &&
    ["Active", "Inactive"].includes((value as BoardType).status);
}

const BoardTypesContext = createContext<{
  boardTypes: BoardType[];
  activeBoardTypes: BoardType[];
  canManageBoardTypes: boolean;
  saveBoardType: (draft: BoardTypeDraft, id?: string) => void;
  deactivateBoardType: (id: string) => void;
} | null>(null);

export function BoardTypesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [boardTypes, setBoardTypes] = useState<BoardType[]>(defaultBoardTypes);
  const [ready, setReady] = useState(false);
  const canManageBoardTypes = user?.role === "Superadmin";

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (Array.isArray(saved) && saved.every(validBoardType)) setBoardTypes(saved);
    } catch {
      // Default board types remain available if local storage cannot be read.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(boardTypes)); }
    catch { /* Changes remain available for the active session. */ }
  }, [boardTypes, ready]);

  const value = useMemo(() => ({
    boardTypes,
    activeBoardTypes: boardTypes.filter((boardType) => boardType.status === "Active"),
    canManageBoardTypes,
    saveBoardType: (draft: BoardTypeDraft, id?: string) => {
      if (!canManageBoardTypes) return;
      const normalized = { ...draft, name: draft.name.trim(), fluteType: draft.fluteType.trim() };
      setBoardTypes((current) => id
        ? current.map((boardType) => boardType.id === id ? { ...boardType, ...normalized } : boardType)
        : [{ id: `board-type-${Date.now()}`, ...normalized, status: "Active" }, ...current]);
    },
    deactivateBoardType: (id: string) => {
      if (!canManageBoardTypes) return;
      setBoardTypes((current) => current.map((boardType) =>
        boardType.id === id ? { ...boardType, status: "Inactive" } : boardType,
      ));
    },
  }), [boardTypes, canManageBoardTypes]);

  return <BoardTypesContext.Provider value={value}>{children}</BoardTypesContext.Provider>;
}

export function useBoardTypes() {
  const context = useContext(BoardTypesContext);
  if (!context) throw new Error("useBoardTypes must be used within BoardTypesProvider");
  return context;
}

export function getBoardTypeLayers(category?: BoardCategory) {
  if (category === "Single Wall") return ["liner1", "fluting1", "liner2"] as const;
  if (category === "Double Wall") return ["liner1", "fluting1", "middleLiner", "fluting2", "liner3"] as const;
  if (category === "Duplex/Paperboard") return ["paperboardType", "paperboardGsm"] as const;
  return [] as const;
}

export const boardLayerLabels = {
  liner1: "Liner 1",
  fluting1: "Fluting 1",
  liner2: "Liner 2",
  middleLiner: "Middle Liner",
  fluting2: "Fluting 2",
  liner3: "Liner 3",
  paperboardType: "Paperboard Type",
  paperboardGsm: "Grammage (GSM)",
} as const;
