import { useState, useCallback } from "react";
import type { MemberRecord, FilterState } from "@/types/member";

const initialFilterState: FilterState = {
  TELEPHONE: "",
  EMAIL: "",
  RCITY: [],
  PCITY: [],
  RSTATE: [],
  PSTATE: [],
  AQUALI: [],
  MEMCAT: [],
  REGIONNAME: [],
  SAL: [],
  membershipDateStart: "",
  membershipDateEnd: "",
};

export function applyFilters(
  members: MemberRecord[],
  filters: FilterState
): MemberRecord[] {
  return members.filter((m) => {
    // Text partial match filters
    if (filters.TELEPHONE && !m.TELEPHONE.toLowerCase().includes(filters.TELEPHONE.toLowerCase()))
      return false;
    if (filters.EMAIL && !m.EMAIL.toLowerCase().includes(filters.EMAIL.toLowerCase()))
      return false;

    // Array multi-select OR filters
    if (filters.RCITY.length > 0 && !filters.RCITY.some((v) => v.toLowerCase() === m.RCITY.toLowerCase()))
      return false;
    if (filters.PCITY.length > 0 && !filters.PCITY.some((v) => v.toLowerCase() === m.PCITY.toLowerCase()))
      return false;
    if (filters.RSTATE.length > 0 && !filters.RSTATE.some((v) => v.toLowerCase() === m.RSTATE.toLowerCase()))
      return false;
    if (filters.PSTATE.length > 0 && !filters.PSTATE.some((v) => v.toLowerCase() === m.PSTATE.toLowerCase()))
      return false;
    if (filters.MEMCAT.length > 0 && !filters.MEMCAT.some((v) => v.toLowerCase() === m.MEMCAT.toLowerCase()))
      return false;
    if (filters.REGIONNAME.length > 0 && !filters.REGIONNAME.some((v) => v.toLowerCase() === m.REGIONNAME.toLowerCase()))
      return false;
    if (filters.SAL.length > 0 && !filters.SAL.some((v) => v.toLowerCase() === m.SAL.toLowerCase()))
      return false;

    // AQUALI: split by comma, check if ANY qualification matches ANY selected filter value
    if (filters.AQUALI.length > 0) {
      const memberQualifications = m.AQUALI.split(",").map((q) => q.trim().toLowerCase()).filter(Boolean);
      const filterValues = filters.AQUALI.map((v) => v.toLowerCase());
      const hasMatch = memberQualifications.some((q) => filterValues.includes(q));
      if (!hasMatch) return false;
    }

    // Date range filter
    if (filters.membershipDateStart || filters.membershipDateEnd) {
      const date = new Date(m.MEMBERSHIPDATE);
      if (filters.membershipDateStart && date < new Date(filters.membershipDateStart))
        return false;
      if (filters.membershipDateEnd && date > new Date(filters.membershipDateEnd))
        return false;
    }

    return true;
  });
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  return {
    filters,
    setFilter,
    resetFilters,
    applyFilters,
  };
}
