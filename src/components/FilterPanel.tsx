import { useMemo } from "react";
import type { MemberRecord, FilterState } from "@/types/member";
import { FilterInput } from "./FilterInput";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { DateRangeFilter } from "./DateRangeFilter";

interface FilterPanelProps {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  members: MemberRecord[];
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

export function FilterPanel({ filters, setFilter, resetFilters, members }: FilterPanelProps) {
  // Derive dropdown options dynamically from all members
  const options = useMemo(() => {
    const rcity: string[] = [];
    const pcity: string[] = [];
    const rstate: string[] = [];
    const pstate: string[] = [];
    const memcat: string[] = [];
    const regionname: string[] = [];
    const sal: string[] = [];
    const aquali: string[] = [];

    for (const m of members) {
      if (m.RCITY) rcity.push(m.RCITY.trim());
      if (m.PCITY) pcity.push(m.PCITY.trim());
      if (m.RSTATE) rstate.push(m.RSTATE.trim());
      if (m.PSTATE) pstate.push(m.PSTATE.trim());
      if (m.MEMCAT) memcat.push(m.MEMCAT.trim());
      if (m.REGIONNAME) regionname.push(m.REGIONNAME.trim());
      if (m.SAL) sal.push(m.SAL.trim());
      if (m.AQUALI) {
        const parts = m.AQUALI.split(",").map((p) => p.trim()).filter(Boolean);
        aquali.push(...parts);
      }
    }

    return {
      RCITY: uniqueSorted(rcity),
      PCITY: uniqueSorted(pcity),
      RSTATE: uniqueSorted(rstate),
      PSTATE: uniqueSorted(pstate),
      MEMCAT: uniqueSorted(memcat),
      REGIONNAME: uniqueSorted(regionname),
      SAL: uniqueSorted(sal),
      AQUALI: uniqueSorted(aquali),
    };
  }, [members]);

  return (
    <div className="space-y-3">
      <FilterInput
        label="Telephone"
        value={filters.TELEPHONE}
        onChange={(v) => setFilter("TELEPHONE", v)}
      />
      <FilterInput
        label="Email"
        value={filters.EMAIL}
        onChange={(v) => setFilter("EMAIL", v)}
      />
      <MultiSelectFilter
        label="Residential City"
        options={options.RCITY}
        selected={filters.RCITY}
        onChange={(v) => setFilter("RCITY", v)}
      />
      <MultiSelectFilter
        label="Professional City"
        options={options.PCITY}
        selected={filters.PCITY}
        onChange={(v) => setFilter("PCITY", v)}
      />
      <MultiSelectFilter
        label="Residential State"
        options={options.RSTATE}
        selected={filters.RSTATE}
        onChange={(v) => setFilter("RSTATE", v)}
      />
      <MultiSelectFilter
        label="Professional State"
        options={options.PSTATE}
        selected={filters.PSTATE}
        onChange={(v) => setFilter("PSTATE", v)}
      />
      <MultiSelectFilter
        label="Qualification"
        options={options.AQUALI}
        selected={filters.AQUALI}
        onChange={(v) => setFilter("AQUALI", v)}
      />
      <MultiSelectFilter
        label="Member Category"
        options={options.MEMCAT}
        selected={filters.MEMCAT}
        onChange={(v) => setFilter("MEMCAT", v)}
      />
      <MultiSelectFilter
        label="Region"
        options={options.REGIONNAME}
        selected={filters.REGIONNAME}
        onChange={(v) => setFilter("REGIONNAME", v)}
      />
      <MultiSelectFilter
        label="Salutation"
        options={options.SAL}
        selected={filters.SAL}
        onChange={(v) => setFilter("SAL", v)}
      />
      <DateRangeFilter
        label="Membership Date"
        startValue={filters.membershipDateStart}
        endValue={filters.membershipDateEnd}
        onStartChange={(v) => setFilter("membershipDateStart", v)}
        onEndChange={(v) => setFilter("membershipDateEnd", v)}
      />
      <DateRangeFilter
        label="Date of Birth"
        startValue={filters.dobStart}
        endValue={filters.dobEnd}
        onStartChange={(v) => setFilter("dobStart", v)}
        onEndChange={(v) => setFilter("dobEnd", v)}
      />
      <button
        type="button"
        onClick={resetFilters}
        className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
}
