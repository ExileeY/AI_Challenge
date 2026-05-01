import { create } from "zustand";
import type { Category, Filters, Quarter } from "../types";

interface LeaderboardState {
  filters: Filters;
  expandedMemberId: string | null;
  setYear: (year: number | null) => void;
  setQuarter: (quarter: Quarter | null) => void;
  setCategory: (category: Category | null) => void;
  setSearch: (search: string) => void;
  toggleExpanded: (memberId: string) => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  filters: {
    year: null,
    quarter: null,
    category: null,
    search: "",
  },
  expandedMemberId: null,
  setYear: (year) =>
    set((state) => ({ filters: { ...state.filters, year } })),
  setQuarter: (quarter) =>
    set((state) => ({ filters: { ...state.filters, quarter } })),
  setCategory: (category) =>
    set((state) => ({ filters: { ...state.filters, category } })),
  setSearch: (search) =>
    set((state) => ({ filters: { ...state.filters, search } })),
  toggleExpanded: (memberId) =>
    set((state) => ({
      expandedMemberId: state.expandedMemberId === memberId ? null : memberId,
    })),
}));
