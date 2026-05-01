import { useLeaderboardStore } from "../../store/leaderboardStore";
import type { Category, Quarter } from "../../types";
import { DropdownFilter } from "./DropdownFilter";
import { SearchInput } from "./SearchInput";

const yearOptions = [
  { label: "All Years", value: "" },
  { label: "2025", value: "2025" },
  { label: "2024", value: "2024" },
  { label: "2023", value: "2023" },
];

const quarterOptions = [
  { label: "All Quarters", value: "" },
  { label: "Q1", value: "Q1" },
  { label: "Q2", value: "Q2" },
  { label: "Q3", value: "Q3" },
  { label: "Q4", value: "Q4" },
];

const categoryOptions = [
  { label: "All Categories", value: "" },
  { label: "Education", value: "Education" },
  { label: "Public Speaking", value: "Public Speaking" },
  { label: "University Partners", value: "University Partners" },
];

export function FilterBar() {
  const { filters, setYear, setQuarter, setCategory, setSearch } =
    useLeaderboardStore();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownFilter
        label="Year"
        value={filters.year?.toString() ?? ""}
        options={yearOptions}
        onChange={(v) => setYear(v ? Number(v) : null)}
      />
      <DropdownFilter
        label="Quarter"
        value={filters.quarter ?? ""}
        options={quarterOptions}
        onChange={(v) => setQuarter((v || null) as Quarter | null)}
      />
      <DropdownFilter
        label="Category"
        value={filters.category ?? ""}
        options={categoryOptions}
        onChange={(v) => setCategory((v || null) as Category | null)}
      />
      <div className="flex-1 min-w-[200px]">
        <SearchInput value={filters.search} onChange={setSearch} />
      </div>
    </div>
  );
}
