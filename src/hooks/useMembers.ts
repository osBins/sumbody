import { useState, useEffect, useCallback } from "react";
import type { MemberRecord } from "@/types/member";
import { getAllMembers } from "@/lib/tauri-commands";

export function useMembers() {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, refetch: fetchMembers };
}
