import { useState, useMemo } from "react";
import { MemberRecord } from "@/types/member";
import { createSearchIndex } from "@/lib/fuse-config";

export function useFuzzySearch(members: MemberRecord[]) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(() => createSearchIndex(members), [members]);

  const results: MemberRecord[] = useMemo(() => {
    if (!query.trim()) {
      return members;
    }
    return fuse.search(query).map((result) => result.item);
  }, [query, members, fuse]);

  return { query, setQuery, results };
}
