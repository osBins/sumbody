import { useState, useEffect, useCallback, useMemo } from "react";
import type { CallLog } from "@/types/member";
import { getCallLogs } from "@/lib/tauri-commands";

export function useCallLogs() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCallLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCallLogs();
      setCallLogs(data);
    } catch (err) {
      console.error("Failed to fetch call logs:", err);
      setCallLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

  /**
   * Derives a map of memberno -> most recent call date string.
   * Used for displaying "Last call: Xd ago" badges.
   */
  const lastCallMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const log of callLogs) {
      // callLogs are already sorted by call_date DESC, so first occurrence is the latest
      if (!map[log.memberno]) {
        map[log.memberno] = log.call_date;
      }
    }
    return map;
  }, [callLogs]);

  return { callLogs, loading, refetch: fetchCallLogs, lastCallMap };
}
