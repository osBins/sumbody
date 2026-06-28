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
  dobStart: "",
  dobEnd: "",
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

    // Date range filter — data stored as MM/DD/YYYY
    if (filters.membershipDateStart || filters.membershipDateEnd) {
      const parts = m.MEMBERSHIPDATE.split("/");
      if (parts.length !== 3) return false;
      const memberDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      if (isNaN(memberDate.getTime())) return false;
      if (filters.membershipDateStart && memberDate < new Date(filters.membershipDateStart))
        return false;
      if (filters.membershipDateEnd && memberDate > new Date(filters.membershipDateEnd))
        return false;
    }

    // DOB range filter — data stored as MM/DD/YYYY
    if (filters.dobStart || filters.dobEnd) {
      const parts = m.DOB.split("/");
      if (parts.length !== 3) return false;
      const dobDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      if (isNaN(dobDate.getTime())) return false;
      if (filters.dobStart && dobDate < new Date(filters.dobStart))
        return false;
      if (filters.dobEnd && dobDate > new Date(filters.dobEnd))
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
