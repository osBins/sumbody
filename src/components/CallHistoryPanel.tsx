import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCallLogs, getMemberCallLogs, deleteCallLog } from "@/lib/tauri-commands";
import { Phone, PhoneIncoming, PhoneOutgoing, Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { CallLog } from "@/types/member";

const PAGE_SIZE = 10;

interface CallHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberno?: string;
  name?: string;
  memberNames?: Record<string, string>;
}

interface CallLogInlineProps {
  memberNames?: Record<string, string>;
  filteredMembernos?: string[];
}

const SUMMARY_TRUNCATE = 100;

function CallLogEntry({ log, memberno, memberNames, onDelete }: { log: CallLog; memberno?: string; memberNames?: Record<string, string>; onDelete?: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const displayName = !memberno && memberNames ? (memberNames[log.memberno] || log.memberno) : null;
  const needsTruncation = log.summary.length > SUMMARY_TRUNCATE;
  const displaySummary = expanded || !needsTruncation ? log.summary : log.summary.slice(0, SUMMARY_TRUNCATE) + "…";

  return (
    <div
      className="rounded-lg border bg-card px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors group/entry"
      onClick={() => needsTruncation && setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {displayName && (
            <span className="text-sm font-medium text-foreground">{displayName}</span>
          )}
          <span className="text-xs text-muted-foreground ml-2">
            {log.call_date}{log.call_time ? ` at ${log.call_time}` : ""}
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(log.id); }}
              className="opacity-0 group-hover/entry:opacity-100 inline-flex items-center justify-center rounded-md p-1 text-destructive hover:bg-destructive/10 transition-all"
              title="Delete call log"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {log.call_type === "inbound" ? (
            <PhoneIncoming className="h-4 w-4 text-blue-500" />
          ) : (
            <PhoneOutgoing className="h-4 w-4 text-green-600" />
          )}
        </div>
      </div>
      {log.summary && (
        <p className={`text-sm text-muted-foreground mt-1.5 leading-snug break-all overflow-hidden ${!expanded && needsTruncation ? "cursor-pointer" : ""}`}>
          {displaySummary}
        </p>
      )}
    </div>
  );
}

/** Inline full-page call log view (used as a tab) */
export function CallLogInline({ memberNames, filteredMembernos }: CallLogInlineProps) {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const fetchLogs = async () => {
      try {
        const data = await getCallLogs();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch call history:", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    let result = logs;

    // Filter by member list filters (from sidebar filters)
    if (filteredMembernos && filteredMembernos.length > 0) {
      const memberSet = new Set(filteredMembernos);
      result = result.filter((log) => memberSet.has(log.memberno));
    }

    if (nameFilter.trim() && memberNames) {
      const q = nameFilter.toLowerCase();
      result = result.filter((log) => {
        const memberName = memberNames[log.memberno] || log.memberno;
        return memberName.toLowerCase().includes(q) || log.memberno.toLowerCase().includes(q);
      });
    }

    if (dateFrom) {
      result = result.filter((log) => log.call_date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((log) => log.call_date <= dateTo);
    }

    return result;
  }, [logs, nameFilter, dateFrom, dateTo, memberNames, filteredMembernos]);

  useEffect(() => {
    setPage(1);
  }, [nameFilter, dateFrom, dateTo]);

  const handleDeleteLog = async (id: number) => {
    try {
      await deleteCallLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Failed to delete call log:", err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col h-full p-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 pb-3 border-b">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by member name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">From:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">To:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"}
        </span>
        {(nameFilter || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { setNameFilter(""); setDateFrom(""); setDateTo(""); }}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto space-y-2 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No call logs found.
          </div>
        ) : (
          paginatedLogs.map((log) => (
            <CallLogEntry key={log.id} log={log} memberNames={memberNames} onDelete={handleDeleteLog} />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredLogs.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-3 border-t">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function CallHistoryPanel({ open, onOpenChange, memberno, name, memberNames }: CallHistoryPanelProps) {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const fetchLogs = async () => {
      try {
        const data = memberno ? await getMemberCallLogs(memberno) : await getCallLogs();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch call history:", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [open, memberno]);

  const filteredLogs = useMemo(() => {
    let result = logs;

    // Filter by member name (only in "all" mode)
    if (!memberno && nameFilter.trim() && memberNames) {
      const q = nameFilter.toLowerCase();
      result = result.filter((log) => {
        const memberName = memberNames[log.memberno] || log.memberno;
        return memberName.toLowerCase().includes(q) || log.memberno.toLowerCase().includes(q);
      });
    }

    // Filter by date range
    if (dateFrom) {
      result = result.filter((log) => log.call_date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((log) => log.call_date <= dateTo);
    }

    return result;
  }, [logs, nameFilter, dateFrom, dateTo, memberno, memberNames]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [nameFilter, dateFrom, dateTo]);

  const handleDeleteLog = async (id: number) => {
    try {
      await deleteCallLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Failed to delete call log:", err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const title = memberno ? `Call History — ${name || memberno}` : "Call History";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pb-3 border-b">
          {!memberno && (
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter by member name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground whitespace-nowrap">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground whitespace-nowrap">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              No call logs found.
            </div>
          ) : (
            paginatedLogs.map((log) => (
              <CallLogEntry key={log.id} log={log} memberno={memberno} memberNames={memberNames} onDelete={handleDeleteLog} />
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredLogs.length > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-3 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
